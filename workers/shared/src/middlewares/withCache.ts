import type { Context } from 'hono';

import { parseUrl } from '@/shared/src/helpers/parseUrl.js';

interface Options<T> {
    context: Context;
    getKey: () => string;
    getCache: () => KVNamespace;
    setCache?: (result: T, ttl: number) => Promise<void>;
    isValidCache?: (result: T) => boolean;
    /** in seconds */
    ttl: number | ((context: Context) => number);
    compute: () => Promise<T>;
}

export async function withCache<T>({ context, getKey, getCache, setCache, isValidCache, ttl, compute }: Options<T>) {
    // Check if cache is disabled via HTTP headers
    const isCacheDisabled = !!(
        context.req.raw.headers.get('cache-control')?.toLowerCase().includes('no-cache') ||
        context.req.raw.headers.get('pragma')?.toLowerCase().includes('no-cache') ||
        context.req.raw.headers.get('cache-control')?.toLowerCase().includes('no-store') ||
        parseUrl(context.req.raw.url)?.searchParams.has('no-cache')
    );

    const cache = getCache();
    const cacheKey = getKey();

    const cached = isCacheDisabled ? null : await cache.get<T>(cacheKey, 'json');
    if (cached) return cached;

    // Compute the value and cache it
    const result = await compute();

    try {
        ttl = typeof ttl === 'function' ? ttl(context) : ttl;
        if (typeof setCache === 'function') {
            await setCache?.(result, ttl);
        } else if (isValidCache?.(result) ?? true) {
            await cache.put(cacheKey, JSON.stringify(result), { expirationTtl: ttl });
        }
    } catch (error) {
        console.error(`[withCache] Error setting cache for ${cacheKey}: ${error}`);
    }

    return result;
}
