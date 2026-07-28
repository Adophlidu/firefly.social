import { stripBasepath } from './runtime/paths.ts';
import { createServerHandler, type CreateServerHandlerOptions, type ServerContext } from './server.ts';

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
            const assetRequest =
                assetPath === url.pathname
                    ? request
                    : new Request(new URL(assetPath + url.search, url.origin), request);
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
export type { EdgeCacheOptions } from './runtime/edge-cache.ts';
export { withEdgeCache } from './runtime/edge-cache.ts';
