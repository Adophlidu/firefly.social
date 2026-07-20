export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/** CDN cache semantics for a route's response. */
export interface CacheConfig {
    /** `s-maxage` seconds for shared (CDN) caches. */
    sMaxAge?: number;
    /** `stale-while-revalidate` seconds. */
    staleWhileRevalidate?: number;
}

export interface ApiContext<TEnv = unknown> {
    /** Route params captured by the matcher. Catchall captures under `*`. */
    params: Record<string, string>;
    request: Request;
    url: URL;
    /** Platform bindings (Cloudflare Worker env, …). Undefined in plain Node. */
    env?: TEnv;
    /** Platform execution context, e.g. for `waitUntil`. */
    ctx?: { waitUntil(promise: Promise<unknown>): void };
}

export type ApiHandler = (context: ApiContext) => unknown;

/**
 * The contract of an API route file (under the configured API directory,
 * `routes/api/` by default): export one function per HTTP method, plus an
 * optional static `config`.
 */
export type ApiRouteModule = Partial<Record<ApiMethod, ApiHandler>> & {
    config?: { cache?: CacheConfig };
};

const METHODS: ApiMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

/**
 * Coerce an arbitrary handler return value into a Response:
 * - `Response` passes through untouched
 * - `null`/`undefined` becomes `204 No Content`
 * - `string` becomes `text/plain`
 * - `URLSearchParams`/`ReadableStream`/`Uint8Array` become the body as-is
 * - everything else is JSON-serialized
 */
export function coerceToResponse(value: unknown): Response {
    if (value instanceof Response) return value;
    if (value === null || value === undefined) return new Response(null, { status: 204 });
    if (typeof value === 'string') {
        return new Response(value, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }
    if (
        value instanceof ReadableStream ||
        value instanceof Uint8Array ||
        value instanceof URLSearchParams
    ) {
        return new Response(value as BodyInit);
    }
    return Response.json(value);
}

/**
 * Dispatch a request to the method handler exported by an API route module.
 * `HEAD` falls back to `GET`. Returns `405` with an `Allow` header when the
 * method is not implemented.
 */
export async function dispatchApiRoute(
    routeModule: ApiRouteModule,
    context: ApiContext,
): Promise<Response> {
    const method = context.request.method.toUpperCase() as ApiMethod;
    const handler = routeModule[method] ?? (method === 'HEAD' ? routeModule.GET : undefined);
    if (!handler) {
        const allow = METHODS.filter((candidate) => routeModule[candidate]).join(', ');
        return new Response('Method Not Allowed', {
            status: 405,
            headers: { allow, 'content-type': 'text/plain' },
        });
    }
    return coerceToResponse(await handler(context));
}
