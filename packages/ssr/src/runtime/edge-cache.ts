import type { WorkersExecutionContext } from '../cloudflare.ts';

export interface EdgeCacheOptions {
    /** Seconds the response may be served from the edge cache. */
    sMaxAge: number;
    /**
     * Extra key material for cache differentiation (e.g. resolved locale,
     * payload-vs-document marker). Appended to the key URL as query params.
     */
    vary?: string[];
}

/** Build the cache key: the request URL plus synthetic vary params. */
function buildCacheKey(request: Request, vary: string[] | undefined): Request {
    if (!vary?.length) return new Request(request.url, { method: 'GET' });
    const url = new URL(request.url);
    for (const [index, value] of vary.entries()) {
        url.searchParams.set(`__vary_${index}`, encodeURIComponent(value).slice(0, 64));
    }
    return new Request(url, { method: 'GET' });
}

interface EdgeCacheStorage {
    match(request: Request): Promise<Response | undefined>;
    put(request: Request, response: Response): Promise<void>;
}

function edgeCache(): EdgeCacheStorage | null {
    const globalCaches = (globalThis as { caches?: { default?: EdgeCacheStorage } }).caches;
    return globalCaches?.default ?? null;
}

/**
 * Wrap a response producer with the Cloudflare edge cache (`caches.default`).
 * Only GET requests are cached; only 200 responses are stored. The response
 * is stamped with `Cache-Control: public, s-maxage=…` unless it already has
 * a Cache-Control header.
 *
 * This is the deliberate replacement for framework-level ISR: plain HTTP
 * caching semantics on top of per-request SSR.
 */
export async function withEdgeCache(
    request: Request,
    ctx: WorkersExecutionContext,
    options: EdgeCacheOptions,
    produce: () => Promise<Response>,
): Promise<Response> {
    const cache = edgeCache();
    if (!cache || request.method !== 'GET') return produce();

    const cacheKey = buildCacheKey(request, options.vary);
    const cached = await cache.match(cacheKey);
    if (cached) {
        const headers = new Headers(cached.headers);
        headers.set('x-ssr-cache', 'hit');
        return new Response(cached.body, { status: cached.status, headers });
    }

    const response = await produce();
    if (response.status === 200) {
        const headers = new Headers(response.headers);
        if (!headers.has('cache-control')) {
            headers.set('cache-control', `public, s-maxage=${options.sMaxAge}`);
        }
        const cacheable = new Response(response.body, { status: response.status, headers });
        ctx.waitUntil(cache.put(cacheKey, cacheable.clone()));
        return cacheable;
    }
    return response;
}
