import { renderToReadableStream } from 'react-dom/server';

import { dispatchApiRoute, type CacheConfig } from './router/api.ts';
import { createMatcher, type RouteMatch } from './router/matcher.ts';
import type { RouteTree } from './router/tree.ts';
import type { ClientAssets } from './runtime/assets.tsx';
import { composeMatch, findBoundaryComponent } from './runtime/compose.tsx';
import { isNotFoundError, isRedirectError } from './runtime/errors.ts';
import { resolveChain } from './runtime/loaders.ts';
import { stripBasepath } from './runtime/paths.ts';
import { resolveChainModules, type RouteModuleInput } from './runtime/resolve-modules.ts';
import { SSR_DATA_HEADER, type NavigationPayload, type SsrPayload } from './runtime/serialize.ts';
import type { ExecutionContextLike, RouteModuleMap } from './runtime/types.ts';

export interface CreateServerHandlerOptions {
    tree: RouteTree;
    /**
     * Route modules — resolved modules, lazy loaders (`() => import(...)`)
     * as emitted by the Vite plugin, or a mix. Loaders are only invoked for
     * the matched chain.
     */
    modules: RouteModuleInput;
    /**
     * App basepath (e.g. `/wallet-iframe`) when the app is mounted under a
     * path prefix. Stripped before route matching.
     */
    basepath?: string;
    /**
     * Client assets to reference from the rendered document (see
     * `<ClientScripts>`/`<ClientStyles>`). Apps using the Vite plugin get
     * this from `virtual:ssr/client-assets`.
     */
    clientAssets?: ClientAssets;
    /** Custom 404 response factory. Defaults to a plain text 404. */
    notFound?: (request: Request) => Response | Promise<Response>;
}

/** Per-request platform context, passed through to loaders and API handlers. */
export interface ServerContext<TEnv = unknown> {
    env?: TEnv;
    ctx?: ExecutionContextLike;
}

export type ServerHandler<TEnv = unknown> = (
    request: Request,
    context?: ServerContext<TEnv>,
) => Promise<Response>;

/** Render a route's static cache config into a `Cache-Control` value. */
export function cacheControlHeader(cache: CacheConfig): string {
    const parts = ['public'];
    if (cache.sMaxAge !== undefined) parts.push(`s-maxage=${cache.sMaxAge}`);
    if (cache.staleWhileRevalidate !== undefined) {
        parts.push(`stale-while-revalidate=${cache.staleWhileRevalidate}`);
    }
    return parts.join(', ');
}

/** True when running under the Vite dev server (SSR environment). */
function isViteDev(): boolean {
    try {
        return Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV);
    } catch {
        return false;
    }
}

interface RenderPageOptions {    matched: RouteMatch;
    modules: RouteModuleMap;
    pathname: string;
    search: URLSearchParams;
    basepath?: string;
    clientAssets?: ClientAssets;
    data: Record<string, unknown>;
    heads: NavigationPayload['heads'];
    status?: number;
    terminalComponent?: Parameters<typeof composeMatch>[0]['terminalComponent'];
    error?: Error;
    notFound?: boolean;
    pending?: boolean;
}

async function renderPage(options: RenderPageOptions): Promise<Response> {
    const { matched, modules } = options;

    const payload: SsrPayload = {
        url: options.pathname,
        params: matched.params,
        data: options.data,
        notFound: options.notFound || undefined,
        error: options.error?.message,
        pending: options.pending || undefined,
        dev: isViteDev() || undefined,
    };
    const element = composeMatch({
        match: matched,
        modules,
        data: options.data,
        heads: options.heads,
        pathname: options.pathname,
        search: options.search,
        payload,
        basepath: options.basepath,
        clientAssets: options.clientAssets,
        terminalComponent: options.terminalComponent,
        error: options.error,
        notFound: options.notFound,
    });

    const stream = await renderToReadableStream(element);

    const headers = new Headers({ 'content-type': 'text/html; charset=utf-8' });
    const cache = modules[matched.page.pageFile ?? '']?.config?.cache;
    if (cache && !options.error && !options.notFound) {
        headers.set('cache-control', cacheControlHeader(cache));
    }

    return new Response(stream, { status: options.status ?? 200, headers });
}

/**
 * Create the fetch handler that powers SSR: match the URL, run loaders,
 * stream the rendered document. Runs on any WinterCG runtime (Cloudflare
 * Workers, Node 18+, Deno, Bun).
 *
 * Loader control flow:
 * - `redirect(url)` → 3xx response (or a `redirect` field in data payloads)
 * - `notFound()` → nearest `notFoundComponent` with 404, else plain 404
 * - any other error → nearest `errorComponent` with 500, else rethrown
 */
export function createServerHandler<TEnv = unknown>(
    options: CreateServerHandlerOptions,
): ServerHandler<TEnv> {
    const { tree, modules: moduleInput, notFound, basepath, clientAssets } = options;
    const match = createMatcher(tree);

    return async (request: Request, context?: ServerContext<TEnv>): Promise<Response> => {
        const url = new URL(request.url);
        const pathname = stripBasepath(url.pathname, basepath);
        const matched = match(pathname);
        if (!matched) {
            return notFound
                ? notFound(request)
                : new Response('Not Found', { status: 404, headers: { 'content-type': 'text/plain' } });
        }

        const platform = { env: context?.env, ctx: context?.ctx };

        // Resolve only the modules of the matched chain — lazy loaders keep
        // the rest of the app's module graph out of server evaluation.
        const modules = await resolveChainModules(matched, moduleInput);

        // API routes dispatch to HTTP method handlers, no rendering involved.
        if (matched.page.pageKind === 'api') {
            const routeModule = modules[matched.page.pageFile ?? ''];
            if (!routeModule) {
                return new Response('Internal Server Error', { status: 500 });
            }
            const response = await dispatchApiRoute(routeModule, {
                params: matched.params,
                request,
                url,
                ...platform,
            });
            const cache = routeModule.config?.cache;
            if (cache && !response.headers.has('cache-control')) {
                response.headers.set('cache-control', cacheControlHeader(cache));
            }
            return response;
        }

        const wantsData = request.headers.get(SSR_DATA_HEADER) === 'true';

        // Client-only pages render just the pending shell on the server;
        // their modules and loaders only run for data requests / on the client.
        // Layouts (non-clientOnly) still load and run their loaders.
        if (matched.page.clientOnly && !wantsData) {
            const { data, heads } = await resolveChain(matched, modules, { request, url, ...platform });
            const pendingBoundary = findBoundaryComponent(matched, modules, 'pending');
            return renderPage({
                matched,
                modules,
                pathname,
                search: url.searchParams,
                basepath,
                clientAssets,
                data,
                heads,
                terminalComponent: pendingBoundary,
                pending: true,
            });
        }
        if (matched.page.clientOnly && wantsData) {
            const fullModules = await resolveChainModules(matched, moduleInput, {
                includeClientOnly: true,
            });
            const { data, heads } = await resolveChain(matched, fullModules, {
                request,
                url,
                ...platform,
            });
            const navigationPayload: NavigationPayload = {
                url: pathname,
                params: matched.params,
                data,
                heads,
            };
            return Response.json(navigationPayload);
        }

        let data: Record<string, unknown>;
        let heads: NavigationPayload['heads'];
        try {
            ({ data, heads } = await resolveChain(matched, modules, { request, url, ...platform }));
        } catch (error) {
            if (isRedirectError(error)) {
                if (wantsData) {
                    const redirectPayload: NavigationPayload = {
                        url: pathname,
                        params: matched.params,
                        data: {},
                        heads: [],
                        redirect: error.url,
                    };
                    return Response.json(redirectPayload);
                }
                return new Response(null, { status: error.status, headers: { location: error.url } });
            }

            if (isNotFoundError(error)) {
                const boundary = findBoundaryComponent(matched, modules, 'notFound');
                if (wantsData) {
                    // With a boundary the client renders the fallback itself;
                    // without one it falls back to a full page load.
                    const notFoundPayload: NavigationPayload = {
                        url: pathname,
                        params: matched.params,
                        data: {},
                        heads: [],
                        notFound: boundary ? true : undefined,
                    };
                    if (boundary) return Response.json(notFoundPayload);
                }
                if (!boundary) {
                    return notFound
                        ? notFound(request)
                        : new Response('Not Found', {
                              status: 404,
                              headers: { 'content-type': 'text/plain' },
                          });
                }
                return renderPage({
                    matched,
                    modules,
                    pathname,
                    search: url.searchParams,
                    basepath,
                    clientAssets,
                    data: {},
                    heads: [],
                    status: 404,
                    terminalComponent: boundary,
                    notFound: true,
                });
            }

            const boundary = findBoundaryComponent(matched, modules, 'error');
            if (!boundary) throw error;
            const failure = error instanceof Error ? error : new Error(String(error));
            if (wantsData) {
                const errorPayload: NavigationPayload = {
                    url: pathname,
                    params: matched.params,
                    data: {},
                    heads: [],
                    error: failure.message,
                };
                return Response.json(errorPayload);
            }
            return renderPage({
                matched,
                modules,
                pathname,
                search: url.searchParams,
                basepath,
                clientAssets,
                data: {},
                heads: [],
                status: 500,
                terminalComponent: boundary,
                error: failure,
            });
        }

        // Client-side navigations fetch a JSON payload instead of HTML.
        if (wantsData) {
            const navigationPayload: NavigationPayload = {
                url: pathname,
                params: matched.params,
                data,
                heads,
            };
            return Response.json(navigationPayload);
        }

        return renderPage({
            matched,
            modules,
            pathname,
            search: url.searchParams,
            basepath,
            clientAssets,
            data,
            heads,
        });
    };
}
