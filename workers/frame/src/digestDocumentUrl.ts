import { anySignal } from '@dimensiondev/workers-shared/helpers/anySignal.js';
import { fetchWithContext } from '@dimensiondev/workers-shared/helpers/fetchWithContext.js';
import { parseJson } from '@dimensiondev/workers-shared/helpers/parseJson.js';
import { parseUrl } from '@dimensiondev/workers-shared/helpers/parseUrl.js';
import type { Context } from 'hono';

import { digestFrameV1 } from '@/frame/src/digestFrameV1.js';
import { digestFrameV2 } from '@/frame/src/digestFrameV2.js';
import { extractFrameVersions } from '@/frame/src/extractFrameVersions.js';
import { matchBuiltInFrame } from '@/frame/src/matchBuiltInFrame.js';
import { resolveFarcasterMiniappHomeUrl } from '@/frame/src/resolveFarcasterMiniappHomeUrl.js';
import type { LinkDigestedResponse } from '@/frame/src/types.js';

const BLACKLISTED_HOSTS = [
    't.me',
    't.co',
    'youtu.be',
    'youtube.com',
    'www.youtube.com',
    'warpcast.com',
    'farcaster.xyz',
];

export async function digestDocument(url: string, html: string, c: Context) {
    const versions = await extractFrameVersions(html, {
        context: c,
        documentUrl: url,
    });
    if (!versions.length) throw new Error(`Version not found: ${url}`);

    const versionV2 = versions.find((version) => version.includes('version') && parseJson(version));
    const versionV1 = versions.find((version) => version.includes('vNext'));

    // v2
    if (versionV2) {
        console.log(`[frame] v2 frame detected: ${url}`);
        return digestFrameV2(url, versionV2, c);
    }

    // v1
    if (versionV1) {
        console.log(`[frame] v1 frame detected: ${url}`);
        return digestFrameV1(url, html, c);
    }

    return null;
}

function isServerError(code: number) {
    return code >= 500 && code < 600;
}
function isRedirect(code: number) {
    return code >= 300 && code < 400;
}

export async function digestDocumentUrl(documentUrl: string, c: Context): Promise<LinkDigestedResponse | null> {
    // built-in frames
    const matched = matchBuiltInFrame(documentUrl);
    if (matched) return matched;

    const resolvedUrl = await resolveFarcasterMiniappHomeUrl(documentUrl, c);

    const url = parseUrl(resolvedUrl);
    if (!url) throw new Error(`[frame] invalid document URL: ${documentUrl}`);

    // Check if the URL is blacklisted
    if (BLACKLISTED_HOSTS.includes(url.hostname)) return null;

    const response = await fetchWithContext(url, {
        // It must respond within 30 seconds.
        signal: anySignal(c.req.raw.signal ?? null, AbortSignal.timeout(30 * 1000)),

        context: c,
    });
    if (isServerError(response.status) || (!response.ok && !isRedirect(response.status))) {
        throw new Error(`[frame] failed to fetch document: ${url} ${response.status}`);
    }
    if (!response.headers.get('content-type')?.startsWith('text/')) return null;

    return {
        frame: await digestDocument(resolvedUrl, await response.text(), c),
    };
}
