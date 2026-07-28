import type { ApiRouteModule, CacheConfig } from '../router/api.ts';
import type { ComponentType, ReactNode } from 'react';

/**
 * Minimal structural shape of a serverless execution context (Cloudflare
 * Workers, Deno, etc.). Only what the framework itself relies on.
 */
export interface ExecutionContextLike {
    waitUntil(promise: Promise<unknown>): void;
}

/** Context passed to every route module's `loader`. */
export interface LoaderContext<TEnv = unknown> {
    /** Route params captured by the matcher. Catchall captures under `*`. */
    params: Record<string, string>;
    /** The incoming request. */
    request: Request;
    /** Parsed request URL. */
    url: URL;
    /** Platform bindings (Cloudflare Worker env, …). Undefined in plain Node. */
    env?: TEnv;
    /** Platform execution context, e.g. for `waitUntil`. */
    ctx?: ExecutionContextLike;
}

export interface HeadMeta {
    name?: string;
    property?: string;
    httpEquiv?: string;
    charSet?: string;
    content: string;
}

export interface HeadLink {
    rel: string;
    href: string;
    type?: string;
    as?: string;
    crossOrigin?: '' | 'anonymous' | 'use-credentials';
}

/** Declarative `<head>` content contributed by one route module. */
export interface HeadDescriptor {
    title?: string;
    meta?: HeadMeta[];
    links?: HeadLink[];
}

export interface HeadContext {
    /** The loader data of the module that declared this `head`. */
    data: unknown;
    params: Record<string, string>;
    /**
     * Loader data of the whole matched chain, keyed by route file. Lets
     * `head` derive metadata from an ancestor layout's data instead of
     * re-fetching the same records the layout's loader already fetched.
     */
    allData?: Record<string, unknown>;
}

/** Static per-route configuration. */
export interface RouteConfig {
    cache?: CacheConfig;
    /**
     * How client-side navigations to this page get their data.
     * - `'payload'` (default): loaders run on the server, the client fetches
     *   a JSON payload.
     * - `'client'`: the payload is skipped; the client renders immediately
     *   (loading boundary as needed) and runs the chain's loaders in the
     *   browser. Requires the loaders to be isomorphic (no server-only
     *   secrets, no CORS-restricted upstreams).
     * The first load is always full SSR regardless of this setting.
     */
    navMode?: 'payload' | 'client';
}

/**
 * The contract of a route file. `default` is the page/layout component;
 * `loader` runs on the server before rendering (and again on client
 * navigations); `head` contributes `<head>` tags based on loader data.
 * `head` may be async: the server always awaits it (an un-awaited promise
 * would leak a floating fetch that can poison shared HTTP clients on
 * runtimes that freeze canceled request contexts, e.g. Cloudflare Workers).
 */
export interface RouteModule {
    default?: ComponentType<{ children?: ReactNode }>;
    loader?: (context: LoaderContext) => unknown;
    head?: (context: HeadContext) => HeadDescriptor | Promise<HeadDescriptor>;
    config?: RouteConfig;
    /**
     * Rendered in place of the page when a loader throws an unexpected
     * error. Also used as a React error boundary for runtime render errors
     * in its subtree. Resolved page-outward: the nearest declaration wins.
     */
    errorComponent?: ComponentType<{ error: Error }>;
    /**
     * Rendered in place of the page when a loader throws `notFound()`.
     * Resolved page-outward like `errorComponent`.
     */
    notFoundComponent?: ComponentType;
    /**
     * Rendered in place of the page during a client-side transition while
     * the next page's data is in flight (layouts keep rendering with reused
     * data). Falls back to `pendingComponent` when absent.
     */
    loadingComponent?: ComponentType;
    /**
     * Rendered in place of the page during slow client-side navigations
     * (after `pendingMs`). Client-only; SSR waits for loaders.
     */
    pendingComponent?: ComponentType;
}

/** Maps route file paths (as passed to `buildRouteTree`) to their modules. */
export type RouteModuleMap = Record<string, RouteModule & ApiRouteModule>;

/**
 * Lazily imports a route module. The Vite plugin emits loaders (rather than
 * eager imports) so the entire client dependency graph is not evaluated at
 * server startup — Cloudflare Workers forbid async I/O, timers and random
 * values in global scope, and eager evaluation of browser-only libraries
 * violates that.
 */
export type RouteModuleLoader = () => Promise<RouteModule & ApiRouteModule>;

/** Maps route file paths to their lazy module loaders. */
export type RouteModuleLoaders = Record<string, RouteModuleLoader>;
