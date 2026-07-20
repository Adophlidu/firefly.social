import { createServerHandler, type ServerContext } from './server.ts';
import type { CreateServerHandlerOptions } from './server.ts';
import { stripBasepath } from './runtime/paths.ts';

/**
 * Minimal structural types for Cloudflare Workers bindings — deliberately
 * not tied to @cloudflare/workers-types so the package stays dependency-free.
 */

export interface AssetsBinding {
    fetch(request: Request): Promise<Response>;
}

export interface WorkersExecutionContext {
    waitUntil(promise: Promise<unknown>): void;
    passThroughOnException?(): void;
}

export interface WorkersEnv {
    ASSETS?: AssetsBinding;
    [key: string]: unknown;
}

export type WorkersFetchHandler<TEnv extends WorkersEnv = WorkersEnv> = (
    request: Request,
    env: TEnv,
    ctx: WorkersExecutionContext,
) => Promise<Response>;

export interface CreateWorkersHandlerOptions extends CreateServerHandlerOptions {
    /**
     * Serve static assets through the ASSETS binding before falling back to
     * SSR/API. Defaults to true when the binding exists.
     */
    assets?: boolean;
}

/**
 * Create a Cloudflare Workers `fetch` handler: static assets first (via the
 * ASSETS binding), then API routes and SSR. `env`/`ctx` are threaded into
 * every loader and API handler.
 */
export function createWorkersHandler<TEnv extends WorkersEnv = WorkersEnv>(
    options: CreateWorkersHandlerOptions,
): WorkersFetchHandler<TEnv> {
    const { assets = true, ...serverOptions } = options;
    const handler = createServerHandler<TEnv>(serverOptions);

    return async (request, env, ctx) => {
        const context: ServerContext<TEnv> = { env, ctx };

        const assetsBinding = env?.ASSETS;
        if (assets && assetsBinding && (request.method === 'GET' || request.method === 'HEAD')) {
            // The assets directory is served from the root; strip the app
            // basepath before the lookup (HTML references base-prefixed URLs).
            const url = new URL(request.url);
            const assetPath = stripBasepath(url.pathname, options.basepath);
            const assetRequest = assetPath === url.pathname ? request : new Request(new URL(assetPath + url.search, url.origin), request);
            const assetResponse = await assetsBinding.fetch(assetRequest);
            if (assetResponse.status !== 404) return assetResponse;
        }

        return handler(request, context);
    };
}

/** Geo information Cloudflare attaches to every request (`request.cf`). */
export interface GeoInfo {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
    latitude?: string;
    longitude?: string;
    /** IATA code of the serving data center, e.g. `NRT`. */
    colo?: string;
}

/** Read geo information from `request.cf` (empty object outside Cloudflare). */
export function getGeo(request: Request): GeoInfo {
    const cf = (request as Request & { cf?: Record<string, unknown> }).cf;
    if (!cf) return {};
    return {
        country: cf.country as string | undefined,
        region: cf.region as string | undefined,
        city: cf.city as string | undefined,
        timezone: cf.timezone as string | undefined,
        latitude: cf.latitude as string | undefined,
        longitude: cf.longitude as string | undefined,
        colo: cf.colo as string | undefined,
    };
}

export interface EdgeCacheOptions {
    /** Seconds the response may be served from the edge cache. */
    sMaxAge: number;
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

    const cacheKey = new Request(request.url, { method: 'GET' });
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
