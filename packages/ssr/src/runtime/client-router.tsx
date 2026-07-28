import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AnchorHTMLAttributes, MouseEvent, ReactElement } from 'react';

import { createMatcher, type RouteMatch } from '../router/matcher.ts';
import type { RouteTree } from '../router/tree.ts';
import { composeMatch, findBoundaryComponent } from './compose.tsx';
import { RouterContext } from './context.ts';
import { isNotFoundError, isRedirectError } from './errors.ts';
import { filesOfMatch, resolveHeads } from './loaders.ts';
import { stripBasepath, withBasepath } from './paths.ts';
import { resolveChainModules, type RouteModuleInput } from './resolve-modules.ts';
import { SSR_DATA_HEADER, type NavigationPayload, type SsrPayload } from './serialize.ts';
import type { HeadDescriptor, LoaderContext, RouteModuleMap } from './types.ts';

export type HistoryMode = 'browser' | 'memory';

function shallowEqualRecord(a: Record<string, string>, b: Record<string, string>): boolean {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    return aKeys.length === bKeys.length && aKeys.every((key) => a[key] === b[key]);
}

/** How long a navigation payload stays reusable (Next.js: 30s for dynamic). */
const PAYLOAD_CACHE_TTL = 30_000;
/** Bound on cached payloads; oldest entry is evicted first. */
const PAYLOAD_CACHE_MAX = 50;

export interface ClientRouterState {
    match: RouteMatch;
    /** Resolved modules of the current chain. */
    modules: RouteModuleMap;
    data: Record<string, unknown>;
    heads: HeadDescriptor[];
    pathname: string;
    search: URLSearchParams;
    /** How this location was reached (set on client-side navigations). */
    navigationType?: 'push' | 'replace';
    /** Present when the current view is an error fallback. */
    error?: Error;
    /** True when the current view is a notFound fallback. */
    notFound?: boolean;
    /** True while a slow navigation is showing its pending fallback. */
    pending?: boolean;
    /**
     * The pendingMs timer fired and the chain swapped to the target route's
     * loading boundary. Distinct from `pending` (any in-flight navigation):
     * the current page must never be replaced by its own loading boundary
     * just because a transition started.
     */
    showLoading?: boolean;
}

export interface ClientAppProps {
    tree: RouteTree;
    /**
     * Route module loaders (as emitted by the Vite plugin) or resolved
     * modules — used to resolve the target chain's modules on navigation.
     */
    moduleLoaders: RouteModuleInput;
    /** Initial state, rebuilt from the dehydration payload. */
    initial: ClientRouterState;
    /** The hydration payload, re-rendered so hydration matches the server. */
    payload: SsrPayload;
    /**
     * `browser` syncs navigation with the URL bar; `memory` keeps it fully
     * in-memory (for apps embedded in an iframe).
     */
    history?: HistoryMode;
    /**
     * App basepath (e.g. `/wallet-iframe`). Link hrefs and navigation
     * targets stay app-relative; payload fetches are prefixed with it.
     */
    basepath?: string;
    /**
     * Milliseconds to wait before showing a route's `pendingComponent`
     * during client-side navigation. Defaults to 1000; set 0 to disable.
     */
    pendingMs?: number;
    /**
     * Prefetch the payload and module chunk of every static route when the
     * browser is idle, so first-time navigations are instant. Defaults to
     * true; param/catchall routes are never prefetched.
     */
    prefetchAll?: boolean;
    /**
     * Rewrite a pathname before matching (mirrors server middleware
     * rewrites, e.g. locale prefixing). Applied on every navigation.
     */
    rewritePathname?: (pathname: string) => string;
}

/**
 * The client-side app: holds the current route state, performs client-side
 * navigations (fetch the target route's JSON payload, swap state), manages
 * `<head>`, history and scroll position.
 */
export function ClientApp(props: ClientAppProps): ReactElement {
    const { tree, moduleLoaders, payload, history = 'browser', basepath, pendingMs = 300, prefetchAll = true, rewritePathname } = props;
    const [state, setState] = useState(props.initial);
    const matcher = useMemo(() => createMatcher(tree), [tree]);
    const navigationId = useRef(0);
    const payloadCache = useRef(new Map<string, { time: number; promise: Promise<NavigationPayload | null> }>());

    // Short-TTL payload cache (Next.js client router semantics): repeat
    // visits, back/forward and hover-prefetched links swap instantly instead
    // of waiting for another server roundtrip. Entries are also written by
    // `prefetch`, so most real clicks hit a warm cache.
    const fetchPayload = useCallback(
        (pathname: string, search: string, have?: string[]): Promise<NavigationPayload | null> => {
            const key = pathname + search + (have?.length ? `|have:${have.join(',')}` : '');
            const cached = payloadCache.current.get(key);
            if (cached && Date.now() - cached.time < PAYLOAD_CACHE_TTL) return cached.promise;
            const headers: Record<string, string> = { [SSR_DATA_HEADER]: 'true' };
            if (have?.length) headers['x-ssr-have'] = have.join(',');
            const promise = fetch(withBasepath(pathname + search, basepath), { headers })
                .then(async (response) => {
                    if (!response.ok) return null;
                    return (await response.json()) as NavigationPayload;
                })
                .catch(() => null);
            if (payloadCache.current.size >= PAYLOAD_CACHE_MAX) {
                const oldest = payloadCache.current.keys().next().value;
                if (oldest !== undefined) payloadCache.current.delete(oldest);
            }
            payloadCache.current.set(key, { time: Date.now(), promise });
            return promise;
        },
        [basepath],
    );

    const navigate = useCallback(
        (to: string, options: { replace?: boolean; scroll?: boolean } = {}) => {
            void (async () => {
                const url = new URL(to, window.location.href);
                const rewritten = rewritePathname?.(url.pathname) ?? url.pathname;
                const target = stripBasepath(rewritten, basepath);
                // Full-load fallback: keep app-relative paths under the basepath.
                const fullLoad = () => {
                    window.location.href =
                        url.origin === window.location.origin
                            ? withBasepath(target, basepath) + url.search + url.hash
                            : url.href;
                };
                const matched = matcher(target);
                if (!matched) {
                    // Outside the router's scope: fall back to a full load.
                    fullLoad();
                    return;
                }

                const id = (navigationId.current += 1);

                const pushUrl = () => {
                    if (history !== 'browser') return;
                    // Keep the browser URL clean (un-rewritten, like Next's
                    // middleware model); the rewrite only affects routing.
                    const href = withBasepath(url.pathname, basepath) + url.search + url.hash;
                    if (options.replace) window.history.replaceState(null, '', href);
                    else window.history.pushState(null, '', href);
                };
                // The URL changes with the click, before any module/data
                // loading — the old page stays interactive underneath.
                pushUrl();

                // Data reuse: a chain file keeps its loader data when it is
                // also in the current chain with identical params and search
                // (the `x-ssr-have` protocol skips its server-side loader).
                const files = filesOfMatch(matched);
                const currentFiles = filesOfMatch(state.match);
                const reusable =
                    shallowEqualRecord(state.match.params, matched.params) &&
                    state.search.toString() === url.searchParams.toString()
                        ? files.filter((file) => currentFiles.includes(file) && state.data[file] !== undefined)
                        : [];
                const reusedData = Object.fromEntries(reusable.map((file) => [file, state.data[file]]));

                const modules = await resolveChainModules(matched, moduleLoaders, {
                    includeClientOnly: true,
                });
                if (id !== navigationId.current) return; // superseded

                // navMode=client routes skip the payload entirely: the page
                // renders immediately and its loaders run in the browser.
                const navMode = modules[matched.page.pageFile ?? '']?.config?.navMode;
                const payloadPromise = navMode === 'client' ? null : fetchPayload(target, url.search, reusable);

                const loaderContext: LoaderContext = {
                    params: matched.params,
                    request: new Request(url.href),
                    url,
                };

                // Instant URL update; the old page stays mounted while the
                // payload is in flight. Only when the payload is slow
                // (pendingMs) AND the new chain can render (every layout has
                // data or no loader) does the page area swap to the route's
                // loading boundary — quick navigations never flash a loader.
                const renderable = files.every((file) => {
                    if (file === matched.page.pageFile) return true;
                    const routeModule = modules[file];
                    if (!routeModule?.default || !routeModule.loader) return true;
                    return reusable.includes(file);
                });
                setState((previous) => ({ ...previous, pending: true }));
                // Swap to the loading boundary only when the route declares
                // one — otherwise the old page stays mounted until the
                // payload lands (no flash, and no data-less page render).
                const loadingBoundary = renderable ? findBoundaryComponent(matched, modules, 'loading') : undefined;
                const pendingTimer = setTimeout(() => {
                    if (navigationId.current !== id || !renderable || !loadingBoundary) return;
                    setState((previous) => ({
                        match: matched,
                        modules,
                        data: { ...reusedData },
                        heads: previous.heads,
                        pathname: target,
                        search: url.searchParams,
                        navigationType: options.replace ? 'replace' : 'push',
                        pending: true,
                        showLoading: true,
                    }));
                }, pendingMs);
                let navigation: NavigationPayload | null = null;
                try {
                    if (navMode === 'client') {
                        navigation = await (async (): Promise<NavigationPayload> => {
                            try {
                                const dataEntries = await Promise.all(
                                    files.map(async (file) => {
                                        if (reusedData[file] !== undefined) return null;
                                        const loader = modules[file]?.loader;
                                        if (!loader) return null;
                                        return [file, await loader(loaderContext)] as const;
                                    }),
                                );
                                if (id !== navigationId.current) {
                                    return { url: target, params: matched.params, data: {}, heads: [] };
                                }
                                const data = {
                                    ...reusedData,
                                    ...Object.fromEntries(
                                        dataEntries.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
                                    ),
                                };
                                const heads = await resolveHeads(matched, modules, data);
                                return { url: target, params: matched.params, data, heads };
                            } catch (error) {
                                if (isRedirectError(error)) {
                                    return { url: target, params: matched.params, data: {}, heads: [], redirect: error.url };
                                }
                                if (isNotFoundError(error)) {
                                    return { url: target, params: matched.params, data: {}, heads: [], notFound: true };
                                }
                                return {
                                    url: target,
                                    params: matched.params,
                                    data: {},
                                    heads: [],
                                    error: error instanceof Error ? error.message : String(error),
                                };
                            }
                        })();
                    } else if (payloadPromise) {
                        navigation = await payloadPromise;
                    }
                } finally {
                    clearTimeout(pendingTimer);
                }
                if (id !== navigationId.current) return; // superseded
                if (!navigation) {
                    fullLoad();
                    return;
                }

                // A loader redirected: follow it as another navigation.
                if (navigation.redirect) {
                    navigate(navigation.redirect, options);
                    return;
                }

                const navigationError = navigation.error ? new Error(navigation.error) : undefined;

                // Client-only modules never reach the server bundle, so
                // their loaders can only run here, in the browser. Fill in
                // the files the payload could not cover.
                let data = { ...reusedData, ...navigation.data };
                const clientOnlyFiles = (tree.clientOnlyFiles?.size ?? 0) > 0 ? filesOfMatch(matched).filter((file) => tree.clientOnlyFiles?.has(file)) : [];
                if (clientOnlyFiles.length > 0 && !navigationError && !navigation.notFound) {
                    try {
                        const extraEntries = await Promise.all(
                            clientOnlyFiles.map(async (file) => {
                                if (data[file] !== undefined) return null;
                                const loader = modules[file]?.loader;
                                if (!loader) return null;
                                return [file, await loader(loaderContext)] as const;
                            }),
                        );
                        if (id !== navigationId.current) return; // superseded
                        const extra = Object.fromEntries(extraEntries.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)));
                        if (Object.keys(extra).length > 0) data = { ...data, ...extra };
                    } catch (error) {
                        if (isRedirectError(error)) {
                            navigate(error.url, options);
                            return;
                        }
                        if (isNotFoundError(error)) {
                            setState((previous) => ({ ...previous, notFound: true }));
                            return;
                        }
                        setState((previous) => ({
                            ...previous,
                            error: error instanceof Error ? error : new Error(String(error)),
                        }));
                        return;
                    }
                }

                // Reused files came without server-computed heads; recompute
                // the chain's heads against the merged data on the client.
                let heads = navigation.heads;
                if (navMode !== 'client' && reusable.length > 0 && !navigationError && !navigation.notFound) {
                    if (id !== navigationId.current) return;
                    heads = await resolveHeads(matched, modules, data);
                }

                if (id !== navigationId.current) return; // superseded
                setState({
                    match: matched,
                    modules,
                    data,
                    heads,
                    pathname: target,
                    search: url.searchParams,
                    navigationType: options.replace ? 'replace' : 'push',
                    error: navigationError,
                    notFound: navigation.notFound || undefined,
                });
                if (options.scroll !== false) window.scrollTo(0, 0);
            })();
        },
        [basepath, fetchPayload, history, matcher, moduleLoaders, pendingMs, rewritePathname, state],
    );

    const prefetch = useCallback(
        (to: string) => {
            const url = new URL(to, window.location.href);
            const rewritten = rewritePathname?.(url.pathname) ?? url.pathname;
            const target = stripBasepath(rewritten, basepath);
            if (matcher(target)) void fetchPayload(target, url.search);
        },
        [basepath, fetchPayload, matcher, rewritePathname],
    );

    useEffect(() => {
        if (history === 'memory') return;
        const onPopState = () => {
            navigate(window.location.pathname + window.location.search, { replace: true });
        };
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, [history, navigate]);

    // A client-only page was server-rendered as its pending shell: load the
    // real page right after hydration.
    const isInitialMount = useRef(true);
    useEffect(() => {
        if (!isInitialMount.current) return;
        isInitialMount.current = false;
        if (props.initial.pending) {
            navigate(props.initial.pathname + window.location.search, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Warm every static route's payload + module chunk while the browser is
    // idle, so first-time navigations feel instant.
    useEffect(() => {
        if (!prefetchAll) return;
        const preload = () => {
            for (const page of tree.pages) {
                if (page.pageKind === 'api') continue;
                if (page.fullSegments.some((segment) => segment.type !== 'static')) continue;
                void fetchPayload(page.path, '');
                void resolveChainModules(
                    { page, chain: [page], params: {} } as RouteMatch,
                    moduleLoaders,
                    { includeClientOnly: true },
                );
            }
        };
        const w = window as Window & {
            requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
            cancelIdleCallback?: (id: number) => void;
        };
        if (typeof w.requestIdleCallback === 'function') {
            const id = w.requestIdleCallback(preload, { timeout: 5000 });
            return () => w.cancelIdleCallback?.(id);
        }
        const id = setTimeout(preload, 1000);
        return () => clearTimeout(id);
    }, [fetchPayload, moduleLoaders, prefetchAll, tree]);

    const terminalComponent = state.notFound
        ? findBoundaryComponent(state.match, state.modules, 'notFound')
        : state.error
          ? findBoundaryComponent(state.match, state.modules, 'error')
          : state.showLoading
            ? findBoundaryComponent(state.match, state.modules, 'loading')
            : state.pending
              ? findBoundaryComponent(state.match, state.modules, 'pending')
              : undefined;

    const element = composeMatch({
        match: state.match,
        modules: state.modules,
        data: state.data,
        heads: state.heads,
        pathname: state.pathname,
        search: state.search,
        payload,
        basepath,
        navigate,
        prefetch,
        terminalComponent,
        error: state.error,
        notFound: state.notFound,
        navigationType: state.navigationType,
    });

    return element;
}

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    /** Prefetch the target's data on hover. Defaults to true. */
    prefetch?: boolean;
}

function isModifiedEvent(event: MouseEvent<HTMLAnchorElement>): boolean {
    return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

/**
 * A router-aware anchor. Renders as a plain `<a>` (fully crawlable); on the
 * client, left-clicks are intercepted into client-side navigations.
 */
export function Link(props: LinkProps): ReactElement {
    const { href, prefetch = true, onClick, onMouseEnter, children, ...rest } = props;

    return (
        <RouterContext.Consumer>
            {(state) => (
                <a
                    href={withBasepath(href, state?.basepath)}
                    onClick={(event) => {
                        onClick?.(event);
                        if (
                            event.defaultPrevented ||
                            event.button !== 0 ||
                            isModifiedEvent(event) ||
                            props.target ||
                            !state?.navigate
                        ) {
                            return;
                        }
                        event.preventDefault();
                        state.navigate(href);
                    }}
                    onMouseEnter={(event) => {
                        onMouseEnter?.(event);
                        if (prefetch) state?.prefetch?.(href);
                    }}
                    {...rest}
                >
                    {children}
                </a>
            )}
        </RouterContext.Consumer>
    );
}
