/**
 * Analyze React Flight (RSC) payloads for client-reference chunk-manifest bloat.
 *
 * Each client component is serialized as I[id, [...chunkUrls], name]. When Turbopack
 * nested async chunking is enabled, every reference carries the full transitive chunk
 * list (~50+ URLs), and duplicate URL strings dominate the payload (~75–80%).
 */

const CLIENT_REF_PATTERN = /I\[(\d+),\[(.*?)\],(".*?"|\w+)\]/gs;

function extractChunkUrls(chunksStr) {
    return [...chunksStr.matchAll(/"(\/_next\/static\/chunks\/[^"]+)"/g)].map((match) => match[1]);
}

/**
 * @param {string} payload Raw RSC flight text (text/x-component response or decoded __next_f segment).
 */
export function analyzeRscFlight(payload) {
    const bytes = Buffer.byteLength(payload, 'utf8');
    const refs = [];
    let match;

    while ((match = CLIENT_REF_PATTERN.exec(payload)) !== null) {
        const [, id, chunksStr, name] = match;
        const chunks = extractChunkUrls(chunksStr);
        refs.push({
            id,
            name,
            chunks,
            listBytes: Buffer.byteLength(chunksStr, 'utf8'),
        });
    }

    const chunkListBytes = refs.reduce((sum, ref) => sum + ref.listBytes, 0);
    const listFingerprints = refs.map((ref) => ref.chunks.join('\0'));
    const uniqueLists = new Set(listFingerprints).size;

    const allUrls = refs.flatMap((ref) => ref.chunks);
    const uniqueUrls = new Set(allUrls);
    const urlBytes = allUrls.reduce((sum, url) => sum + Buffer.byteLength(url, 'utf8'), 0);
    const uniqueUrlBytes = [...uniqueUrls].reduce((sum, url) => sum + Buffer.byteLength(url, 'utf8'), 0);

    const refsBySize = [...refs].sort((a, b) => b.chunks.length - a.chunks.length);

    return {
        bytes,
        clientRefCount: refs.length,
        uniqueChunkLists: uniqueLists,
        chunkListBytes,
        chunkListShare: bytes > 0 ? chunkListBytes / bytes : 0,
        avgChunksPerRef: refs.length > 0 ? allUrls.length / refs.length : 0,
        maxChunksPerRef: refsBySize[0]?.chunks.length ?? 0,
        totalChunkUrlOccurrences: allUrls.length,
        uniqueChunkUrls: uniqueUrls.size,
        chunkUrlBytes: urlBytes,
        chunkUrlShare: bytes > 0 ? urlBytes / bytes : 0,
        dedupSavingsBytes: urlBytes - uniqueUrlBytes,
        dedupSavingsShare: bytes > 0 ? (urlBytes - uniqueUrlBytes) / bytes : 0,
        largestRefs: refsBySize.slice(0, 10).map((ref) => ({
            name: ref.name,
            id: ref.id,
            chunkCount: ref.chunks.length,
            listBytes: ref.listBytes,
        })),
    };
}

export function renderRscFlightMarkdown(path, analysis) {
    const pct = (value) => `${(value * 100).toFixed(1)}%`;

    const lines = [
        `# RSC flight analysis: \`${path}\``,
        '',
        '| Metric | Value |',
        '| --- | ---: |',
        `| Payload size | ${analysis.bytes.toLocaleString()} bytes (${(analysis.bytes / 1024).toFixed(1)} KB) |`,
        `| Client refs \`I[id,[chunks],name]\` | ${analysis.clientRefCount} |`,
        `| Unique chunk lists | ${analysis.uniqueChunkLists} |`,
        `| Chunk-list string bytes | ${analysis.chunkListBytes.toLocaleString()} (${pct(analysis.chunkListShare)}) |`,
        `| Avg chunks per ref | ${analysis.avgChunksPerRef.toFixed(1)} |`,
        `| Max chunks per ref | ${analysis.maxChunksPerRef} |`,
        `| Chunk URL occurrences | ${analysis.totalChunkUrlOccurrences} (${analysis.uniqueChunkUrls} unique) |`,
        `| Chunk URL bytes | ${analysis.chunkUrlBytes.toLocaleString()} (${pct(analysis.chunkUrlShare)}) |`,
        `| Est. dedup savings | ${analysis.dedupSavingsBytes.toLocaleString()} bytes (${pct(analysis.dedupSavingsShare)}) |`,
        '',
        '## Largest client refs',
        '',
        '| Name | Chunks | List bytes |',
        '| --- | ---: | ---: |',
    ];

    for (const ref of analysis.largestRefs) {
        lines.push(`| ${ref.name} | ${ref.chunkCount} | ${ref.listBytes.toLocaleString()} |`);
    }

    lines.push(
        '',
        '## Notes',
        '',
        '- High **chunk-list share** (>60%) is bundler-level: Turbopack nested async chunking pre-enumerates all dynamic-import paths per client ref.',
        '- Set `experimental.turbopackClientSideNestedAsyncChunking: false` to shorten per-ref chunk lists (React upstream dedup: facebook/react#36198).',
        '',
    );

    return `${lines.join('\n')}\n`;
}
