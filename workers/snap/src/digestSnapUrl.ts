import { anySignal } from '@dimensiondev/workers-shared/helpers/anySignal.js';
import { fetchWithContext } from '@dimensiondev/workers-shared/helpers/fetchWithContext.js';
import { parseJson } from '@dimensiondev/workers-shared/helpers/parseJson.js';
import { parseUrl } from '@dimensiondev/workers-shared/helpers/parseUrl.js';
import type { Context } from 'hono';

import type { Snap, SnapDigestedResponse } from '@/snap/src/types.js';

export const SNAP_CONTENT_TYPE = 'application/vnd.farcaster.snap+json';

const BLACKLISTED_HOSTS = ['t.me', 't.co', 'youtu.be', 'youtube.com', 'www.youtube.com'];

/**
 * Attempt to fetch a URL as a Farcaster Snap.
 * Returns a snap response if the URL serves `application/vnd.farcaster.snap+json`,
 * otherwise returns null.
 */
export async function digestSnapUrl(documentUrl: string, c: Context): Promise<SnapDigestedResponse | null> {
    const url = parseUrl(documentUrl);
    if (!url) return null;
    if (BLACKLISTED_HOSTS.includes(url.hostname)) return null;

    const response = await fetchWithContext(url, {
        method: 'GET',
        headers: {
            Accept: `${SNAP_CONTENT_TYPE}, text/html`,
        },
        signal: anySignal(c.req.raw.signal ?? null, AbortSignal.timeout(10_000)),
        context: c,
    });

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes(SNAP_CONTENT_TYPE)) return null;

    const text = await response.text();
    const parsed = parseJson<Partial<Snap>>(text);

    if (!parsed || (parsed.version !== '1.0' && parsed.version !== '2.0') || !parsed.ui?.root || !parsed.ui?.elements) {
        return null;
    }

    const snap: Snap = {
        url: documentUrl,
        version: parsed.version,
        theme: parsed.theme,
        effects: parsed.effects,
        ui: parsed.ui,
    };

    return { snap };
}
