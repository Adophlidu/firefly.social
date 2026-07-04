import crypto from 'node:crypto';

const MIN_DUPLICATE_BYTES = 256;

function sha256(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

function extractRscChunks(html) {
    const chunks = [];
    const pushPattern = /self\.__next_f\.push\(\[([\s\S]*?)\]\)/g;
    let match;

    while ((match = pushPattern.exec(html)) !== null) {
        chunks.push({
            kind: 'rsc-flight',
            content: match[1],
            size: match[1].length,
        });
    }

    return chunks;
}

function extractScriptBodies(html) {
    const scripts = [];
    const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = scriptPattern.exec(html)) !== null) {
        const content = match[1].trim();
        if (content.length >= MIN_DUPLICATE_BYTES) {
            scripts.push({
                kind: 'script-inline',
                content,
                size: content.length,
            });
        }
    }

    return scripts;
}

function extractVisibleText(html) {
    const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
    const text = withoutScripts
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return text.length >= MIN_DUPLICATE_BYTES ? [{ kind: 'visible-text', content: text, size: text.length }] : [];
}

function findRepeatedSubstrings(content, minBytes = MIN_DUPLICATE_BYTES) {
    const duplicates = [];
    const seen = new Map();

    for (let size = Math.min(4096, content.length); size >= minBytes; size = Math.floor(size * 0.75)) {
        seen.clear();

        for (let index = 0; index <= content.length - size; index += Math.max(1, Math.floor(size / 8))) {
            const slice = content.slice(index, index + size);
            const hash = sha256(slice);
            const entry = seen.get(hash);

            if (entry) {
                entry.count += 1;
                entry.positions.push(index);
            } else {
                seen.set(hash, { count: 1, positions: [index], preview: slice.slice(0, 120) });
            }
        }

        for (const [hash, entry] of seen.entries()) {
            if (entry.count > 1) {
                duplicates.push({
                    hash,
                    size,
                    count: entry.count,
                    wastedBytes: (entry.count - 1) * size,
                    positions: entry.positions.slice(0, 5),
                    preview: entry.preview,
                });
            }
        }

        if (duplicates.length > 0) break;
    }

    return duplicates.sort((a, b) => b.wastedBytes - a.wastedBytes).slice(0, 20);
}

export function analyzeHtml(html, pagePath) {
    const segments = [...extractRscChunks(html), ...extractScriptBodies(html), ...extractVisibleText(html)];
    const withinPageDuplicates = [];

    for (const segment of segments) {
        const repeats = findRepeatedSubstrings(segment.content);
        if (repeats.length > 0) {
            withinPageDuplicates.push({
                kind: segment.kind,
                segmentSize: segment.size,
                repeats,
            });
        }
    }

    const fingerprintChunks = segments
        .filter((segment) => segment.size >= MIN_DUPLICATE_BYTES)
        .map((segment) => ({
            kind: segment.kind,
            hash: sha256(segment.content),
            size: segment.size,
        }));

    const rscChunkCount = segments.filter((segment) => segment.kind === 'rsc-flight').length;
    const rscBytes = segments
        .filter((segment) => segment.kind === 'rsc-flight')
        .reduce((sum, segment) => sum + segment.size, 0);

    return {
        pagePath,
        htmlBytes: html.length,
        rscChunkCount,
        rscBytes,
        scriptCount: segments.filter((segment) => segment.kind === 'script-inline').length,
        fingerprintChunks,
        withinPageDuplicates,
        wastedBytesEstimate: withinPageDuplicates.reduce((sum, group) => sum + (group.repeats[0]?.wastedBytes ?? 0), 0),
    };
}

export function analyzeCollection(pageResults) {
    const chunkIndex = new Map();
    const successful = pageResults.filter((page) => page.ok && page.analysis);

    for (const page of successful) {
        for (const chunk of page.analysis.fingerprintChunks) {
            const key = `${chunk.kind}:${chunk.hash}`;
            const existing = chunkIndex.get(key) ?? {
                kind: chunk.kind,
                hash: chunk.hash,
                size: chunk.size,
                pages: [],
            };
            existing.pages.push(page.path);
            chunkIndex.set(key, existing);
        }
    }

    const crossPageDuplicates = [...chunkIndex.values()]
        .filter((entry) => entry.pages.length > 1)
        .sort((a, b) => b.size * b.pages.length - a.size * a.pages.length)
        .map((entry) => ({
            kind: entry.kind,
            hash: entry.hash,
            size: entry.size,
            pageCount: entry.pages.length,
            pages: entry.pages,
            totalBytes: entry.size * entry.pages.length,
        }));

    const largestPages = successful
        .map((page) => ({
            path: page.path,
            htmlBytes: page.analysis.htmlBytes,
            rscBytes: page.analysis.rscBytes,
            wastedBytesEstimate: page.analysis.wastedBytesEstimate,
        }))
        .sort((a, b) => b.htmlBytes - a.htmlBytes)
        .slice(0, 20);

    const withinPageHotspots = successful
        .flatMap((page) =>
            page.analysis.withinPageDuplicates.map((dup) => ({
                path: page.path,
                kind: dup.kind,
                segmentSize: dup.segmentSize,
                topRepeat: dup.repeats[0] ?? null,
            })),
        )
        .filter((entry) => entry.topRepeat)
        .sort((a, b) => (b.topRepeat?.wastedBytes ?? 0) - (a.topRepeat?.wastedBytes ?? 0))
        .slice(0, 30);

    return {
        collectedAt: new Date().toISOString(),
        pageCount: pageResults.length,
        successCount: successful.length,
        failureCount: pageResults.length - successful.length,
        totalHtmlBytes: successful.reduce((sum, page) => sum + page.analysis.htmlBytes, 0),
        totalRscBytes: successful.reduce((sum, page) => sum + page.analysis.rscBytes, 0),
        totalWastedBytesEstimate: successful.reduce((sum, page) => sum + page.analysis.wastedBytesEstimate, 0),
        largestPages,
        withinPageHotspots,
        crossPageDuplicates,
    };
}

export function renderMarkdownReport(summary) {
    const lines = [
        '# SSR page collection report',
        '',
        `- Pages attempted: ${summary.pageCount}`,
        `- Successful: ${summary.successCount}`,
        `- Failed: ${summary.failureCount}`,
        `- Total HTML bytes: ${summary.totalHtmlBytes.toLocaleString()}`,
        `- Total RSC bytes: ${summary.totalRscBytes.toLocaleString()}`,
        `- Estimated within-page duplicate waste: ${summary.totalWastedBytesEstimate.toLocaleString()} bytes`,
        '',
        '## Largest pages',
        '',
        '| Path | HTML bytes | RSC bytes | Est. duplicate waste |',
        '| --- | ---: | ---: | ---: |',
    ];

    for (const page of summary.largestPages) {
        lines.push(
            `| \`${page.path}\` | ${page.htmlBytes.toLocaleString()} | ${page.rscBytes.toLocaleString()} | ${page.wastedBytesEstimate.toLocaleString()} |`,
        );
    }

    lines.push('', '## Within-page duplication hotspots', '');

    if (summary.withinPageHotspots.length === 0) {
        lines.push('_No large repeated substrings detected._');
    } else {
        lines.push('| Path | Segment | Repeat size | Count | Wasted bytes | Preview |');
        lines.push('| --- | --- | ---: | ---: | ---: | --- |');

        for (const hotspot of summary.withinPageHotspots.slice(0, 15)) {
            const repeat = hotspot.topRepeat;
            lines.push(
                `| \`${hotspot.path}\` | ${hotspot.kind} | ${repeat.size.toLocaleString()} | ${repeat.count} | ${repeat.wastedBytes.toLocaleString()} | ${repeat.preview.replace(/\|/g, '\\|')}… |`,
            );
        }
    }

    lines.push('', '## Identical chunks shared across pages', '');

    if (summary.crossPageDuplicates.length === 0) {
        lines.push('_No identical large chunks shared across pages._');
    } else {
        lines.push('| Kind | Size | Pages | Total bytes | Example paths |');
        lines.push('| --- | ---: | ---: | ---: | --- |');

        for (const dup of summary.crossPageDuplicates.slice(0, 15)) {
            lines.push(
                `| ${dup.kind} | ${dup.size.toLocaleString()} | ${dup.pageCount} | ${dup.totalBytes.toLocaleString()} | ${dup.pages
                    .slice(0, 3)
                    .map((p) => `\`${p}\``)
                    .join(', ')} |`,
            );
        }
    }

    lines.push(
        '',
        '## Next steps',
        '',
        '- Prioritize pages with high **Est. duplicate waste** — often metadata + layout fetching the same payload twice.',
        '- Compare RSC chunk counts before/after deduping `get*PageMetadata` + `get*PageData` pairs.',
        '- Update `apps/web/scripts/ssr-pages.routes.json` with real local IDs for dynamic routes.',
        '',
    );

    return `${lines.join('\n')}\n`;
}
