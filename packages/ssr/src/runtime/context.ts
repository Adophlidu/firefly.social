import { createContext, useContext } from 'react';

import type { HeadDescriptor } from './types.ts';

export interface RouterState {
    /** Current app-relative URL pathname (basepath stripped). */
    pathname: string;
    /** Current URL search params. */
    search: URLSearchParams;
    /** Matched route params (catchall under `*`). */
    params: Record<string, string>;
    /** Loader data keyed by route file path. */
    data: Record<string, unknown>;
    /** Files of the matched chain's modules (root/layout/page), root first. */
    files: string[];
    /** Head descriptors contributed by the matched chain, root first. */
    heads: HeadDescriptor[];
    /**
     * Layout slot content collected from the matched chain (inner modules
     * override outer ones), consumed by `<Slot>` in layouts. Values are
     * components, resolved at render time.
     */
    slots?: Record<string, import('react').ComponentType>;
    /**
     * The error a loader threw, when the page is rendering an
     * `errorComponent` fallback. Also present in the hydration payload (as a
     * message) so server and client render identically.
     */
    error?: Error;
    /** True when rendering a `notFoundComponent` fallback. */
    notFound?: boolean;
    /** True while a client-side navigation payload is in flight. */
    pending?: boolean;
    /** Client-side navigation. Undefined during server rendering. */
    navigate?: (to: string, options?: { replace?: boolean; scroll?: boolean }) => void;
    /** Prefetch a route's data payload. Undefined during server rendering. */
    prefetch?: (to: string) => void;
    /**
     * How the current location was reached. `undefined` for the initial
     * (hydrated) location; `'push'` or `'replace'` after client-side
     * navigations. Lets applications maintain their own history stacks.
     */
    navigationType?: 'push' | 'replace';
    /** App basepath, when the app is mounted under a path prefix. */
    basepath?: string;
    /** Client assets to load, rendered by `<ClientScripts>`/`<ClientStyles>`. */
    clientAssets?: import('./assets.tsx').ClientAssets;
    /**
     * The dehydration payload, rendered by `<SsrDataOutlet>`. Internal —
     * applications should not read this directly.
     */
    payload?: import('./serialize.ts').SsrPayload;
}

export const RouterContext = createContext<RouterState | null>(null);

export function useRouterState(): RouterState {
    const state = useContext(RouterContext);
    if (!state) throw new Error('useRouterState must be used within a routed app');
    return state;
}

export function useParams(): Record<string, string> {
    return useRouterState().params;
}

/** Current URL search params (reactive to navigation). */
export function useSearch(): URLSearchParams {
    return useRouterState().search;
}

/** Remove `(group)` segments from a route file path. */
function stripRouteGroups(file: string): string {
    return file.replace(/(?:^|\/)\([^)]+\)\//g, '');
}

/**
 * Find a chain data entry by route file, tolerating `(group)` moves
 * (same rule as useLoaderData's fallback).
 */
export function findChainData<T = unknown>(allData: Record<string, unknown> | undefined, file: string): T | undefined {
    if (!allData) return undefined;
    if (file in allData) return allData[file] as T;
    const normalized = stripRouteGroups(file);
    for (const [key, value] of Object.entries(allData)) {
        if (stripRouteGroups(key) === normalized) return value as T;
    }
    return undefined;
}

/**
 * Read loader data. Without arguments returns the data of the innermost
 * matched module (usually the page); pass a route file path to read the
 * data of a specific layout or the root. Group segments are organizational
 * only, so a file path that no longer matches exactly (after a file moved
 * between groups) falls back to a group-insensitive match.
 */
export function useLoaderData<T = unknown>(file?: string): T {
    const state = useRouterState();
    const key = file ?? state.files.at(-1);
    if (!key) throw new Error('useLoaderData: no matched route');
    if (key in state.data) return state.data[key] as T;
    const normalized = stripRouteGroups(key);
    for (const [dataKey, value] of Object.entries(state.data)) {
        if (stripRouteGroups(dataKey) === normalized) return value as T;
    }
    return undefined as T;
}

/**
 * Client-side navigation. Safe to call during SSR (returns a stub that
 * throws only if invoked, since navigating during server rendering is a
 * programming error — use `redirect()` in loaders instead).
 */
export function useNavigate(): (to: string, options?: { replace?: boolean; scroll?: boolean }) => void {
    const { navigate } = useRouterState();
    if (!navigate) {
        return () => {
            throw new Error('navigate() cannot be called during server rendering; use redirect() in loaders instead');
        };
    }
    return navigate;
}

/**
 * True while a client-side navigation is in flight (payload loading). When
 * the new chain can render immediately, the target page already shows its
 * loading boundary; otherwise the previous page stays mounted — apps use
 * this to show a global progress indicator for that case.
 */
export function useIsNavigating(): boolean {
    return Boolean(useRouterState().pending);
}
