import type { Context } from 'hono';

import { ONE_YEAR } from '@/shared/src/constants/duration.js';
import { fetchWithContext } from '@/shared/src/helpers/fetchWithContext.js';
import { parseJson } from '@/shared/src/helpers/parseJson.js';

const VERSION = 1;

function getCacheKey(link: string) {
    return `tco:${VERSION}:${encodeURIComponent(link)}`;
}

function isTcoLink(u: string) {
    return u.startsWith('https://t.co/') && u !== 'https://t.co/';
}

async function getTitleLocation(response: Response) {
    let title = '';
    const rewriter = new HTMLRewriter().on('title', {
        text(text) {
            title += text.text;
        },
    });
    await rewriter.transform(response).text();
    return /^https?:\/\//i.test(title.trim()) ? title : null;
}

async function resolveLink(u: string, c: Context): Promise<string | null> {
    if (!isTcoLink(u)) return null;
    const response = await fetchWithContext(u, {
        redirect: 'manual',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        context: c,
    });
    if (response.status === 200 && response.headers.get('Content-Type')?.includes('text/html')) {
        return getTitleLocation(response);
    }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
        return response.headers.get('Location') ?? null;
    }
    return null;
}

/**
 * Resolves a t.co link using cache if available, otherwise resolves and caches the result.
 * @param link - The t.co link to resolve
 * @param cache - The KVNamespace to use for caching
 * @returns The resolved link, or the original link if not resolved
 */
export async function resolveTcoLink(link: string, c: Context): Promise<string> {
    if (!isTcoLink(link)) return link;

    const context = c as Context<{ Bindings: { TCO_CACHE: KVNamespace } }>;

    const cacheKey = getCacheKey(link);
    let resolved: string | undefined = undefined;

    // Try cache first
    const cachedRaw = await context.env.TCO_CACHE.get(cacheKey);
    if (cachedRaw) {
        const cached = parseJson<{ resolved?: string }>(cachedRaw);
        if (cached && typeof cached === 'object' && typeof cached.resolved === 'string') {
            resolved = cached.resolved;
        }
    }
    if (!resolved) {
        const result = await resolveLink(link, context);
        if (result && result !== link) {
            resolved = result;
            await context.env.TCO_CACHE.put(cacheKey, JSON.stringify({ resolved }), { expirationTtl: ONE_YEAR });
        }
    }
    return resolved && resolved !== link ? resolved : link;
}
