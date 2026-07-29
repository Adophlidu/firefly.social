import type { AnchorHTMLAttributes, MouseEvent, ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { createMatcher, type RouteMatch } from '../router/matcher.ts';
import type { RouteTree } from '../router/tree.ts';
import { composeMatch, findBoundaryComponent } from './compose.tsx';
import { RouterContext } from './context.ts';
import { isNotFoundError, isRedirectError } from './errors.ts';
import { filesOfMatch, resolveHeads } from './loaders.ts';
import { stripBasepath, withBasepath } from './paths.ts';
import { resolveChainModules, type RouteModuleInput } from './resolve-modules.ts';
import { type NavigationPayload, SSR_DATA_HEADER, type SsrPayload } from './serialize.ts';
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
    /** In-flight loaders of an instant (navMode=client) transition. */
    loaderPromises?: Record<string, Promise<unknown>>;
    /** Rejected loaders of an instant (navMode=client) transition. */
    loaderErrors?: Record<string, unknown>;
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
    const {
        tree,
        moduleLoaders,
        payload,
        history = 'browser',
        basepath,
        pendingMs = 300,
        prefetchAll = true,
        rewritePathname,
    } = props;
    const [state, setState] = useState(props.initial);
    const matcher = useMemo(() => createMatcher(tree), [tree]);
    const navigationId = useRef(0);
    const payloadCache = useRef(new Map<string, { time: number; promise: Promise<NavigationPayload | null> }>());
    // Last known scrollY per visited path (pathname+search), restored after
    // back/forward commits once the target page has rendered.
    const scrollPositions = useRef(new Map<string, number>());
    // Synchronously-updated loader results. useLoaderData reads this first,
    // so a suspense retry right after a promise resolves can never observe
    // a still-empty data map and re-suspend on an already-resolved promise.
    const loaderResults = useRef<Record<string, unknown>>({});
    // Warm loader data for navMode=client routes, filled by hover prefetch
    // and completed navigations — repeat visits and back/forward commit with
    // zero suspense.
    const loaderCache = useRef(new Map<string, { time: number; data: Record<string, unknown> }>());

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
        (to: string, options: { replace?: boolean; scroll?: boolean; restoreScroll?: boolean } = {}) => {
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
                // Leaving a page: remember its scroll position for a later
                // back/forward visit (see the restore after the commit).
                if (history === 'browser' && !options.replace) {
                    scrollPositions.current.set(window.location.pathname + window.location.search, window.scrollY);
                }
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

                const navMode = modules[matched.page.pageFile ?? '']?.config?.navMode;

                // Instant transition (navMode=client): mount the new chain
                // right away and let in-flight loaders suspend to their
                // loading boundaries, instead of holding the old page until
                // every loader has settled.
                if (navMode === 'client') {
                    const cacheKey = target + url.search;
                    const cachedEntry = loaderCache.current.get(cacheKey);
                    const cached =
                        cachedEntry && Date.now() - cachedEntry.time < PAYLOAD_CACHE_TTL ? cachedEntry.data : undefined;
                    const initialData = { ...cached, ...reusedData };
                    for (const key of Object.keys(loaderResults.current)) {
                        if (!(key in initialData)) delete loaderResults.current[key];
                    }
                    const settledValues: Record<string, unknown> = {};
                    const loaderPromises: Record<string, Promise<unknown>> = {};
                    const loaderErrors: Record<string, unknown> = {};

                    const loaderContext: LoaderContext = {
                        params: matched.params,
                        request: new Request(url.href),
                        url,
                    };

                    // Only page/layout-declared `loadingComponent`s count as a
                    // transition skeleton. A root-level `pendingComponent`
                    // (the client-only SSR shell) must not push every chain
                    // into the instant path — skeleton-less pages hold the
                    // old page instead of flashing the shell.
                    const hasLoadingBoundary = files.some((file) => Boolean(modules[file]?.loadingComponent));

                    const settleHandlers: Promise<unknown>[] = [];
                    for (const file of files) {
                        if (initialData[file] !== undefined) continue;
                        const loader = modules[file]?.loader;
                        if (!loader) continue;
                        const promise = Promise.resolve().then(() => loader(loaderContext));
                        loaderPromises[file] = promise;
                        settleHandlers.push(
                            promise.then(
                                (value) => {
                                    settledValues[file] = value;
                                    loaderResults.current[file] = value;
                                    if (navigationId.current !== id) return;
                                    setState((previous) => {
                                        const nextPromises = { ...previous.loaderPromises };
                                        delete nextPromises[file];
                                        return {
                                            ...previous,
                                            data: { ...previous.data, [file]: value },
                                            loaderPromises: nextPromises,
                                        };
                                    });
                                },
                                async (error) => {
                                    if (navigationId.current !== id) return;
                                    if (isRedirectError(error)) {
                                        navigate(error.url, options);
                                        return;
                                    }
                                    // Degrade to the server when a browser-run
                                    // loader fails — the server has no
                                    // browser-CORS limits and may succeed
                                    // where the client cannot.
                                    const have = files.filter((other) => other !== file);
                                    const payload = await fetchPayload(target, url.search, have);
                                    const recovered = payload?.data?.[file];
                                    if (navigationId.current !== id) return;
                                    if (recovered !== undefined) {
                                        settledValues[file] = recovered;
                                        loaderResults.current[file] = recovered;
                                        setState((previous) => {
                                            const nextPromises = { ...previous.loaderPromises };
                                            delete nextPromises[file];
                                            return {
                                                ...previous,
                                                data: { ...previous.data, [file]: recovered },
                                                loaderPromises: nextPromises,
                                            };
                                        });
                                        return;
                                    }
                                    setState((previous) => {
                                        const nextPromises = { ...previous.loaderPromises };
                                        delete nextPromises[file];
                                        return {
                                            ...previous,
                                            loaderPromises: nextPromises,
                                            loaderErrors: { ...previous.loaderErrors, [file]: error },
                                        };
                                    });
                                },
                            ),
                        );
                    }

                    // Show the progress indicator immediately, whichever
                    // swap strategy the chain uses.
                    setState((previous) => ({ ...previous, pending: true }));

                    if (hasLoadingBoundary) {
                        // Instant swap: mount now, suspending loaders show
                        // their declared skeleton.
                        setState((previous) => ({
                            match: matched,
                            modules,
                            data: initialData,
                            heads: previous.heads,
                            pathname: target,
                            search: url.searchParams,
                            navigationType: options.replace ? 'replace' : 'push',
                            pending: true,
                            loaderPromises,
                            loaderErrors,
                        }));
                        if (options.scroll !== false) window.scrollTo(0, 0);
                    }
                    // No skeleton anywhere in the chain: hold the old page
                    // (no white flash) and commit once below, when every
                    // loader has settled.

                    const restoreScrollPosition = () => {
                        if (!options.restoreScroll || history !== 'browser') return;
                        const saved = scrollPositions.current.get(window.location.pathname + window.location.search);
                        if (!saved) return;
                        // Apply immediately (right after the flushed commit,
                        // before the next paint) and keep retrying while the
                        // document is still too short to hold the position.
                        let attempts = 0;
                        const apply = () => {
                            window.scrollTo(0, saved);
                            attempts += 1;
                            if (
                                attempts < 12 &&
                                window.scrollY <
                                    Math.min(saved, document.documentElement.scrollHeight - window.innerHeight)
                            ) {
                                setTimeout(apply, 80);
                            }
                        };
                        apply();
                    };

                    await Promise.allSettled(settleHandlers);
                    if (id !== navigationId.current) return; // superseded

                    const finalData = { ...initialData, ...settledValues };
                    if (Object.keys(settledValues).length > 0) {
                        if (loaderCache.current.size >= PAYLOAD_CACHE_MAX) {
                            const oldest = loaderCache.current.keys().next().value;
                            if (oldest !== undefined) loaderCache.current.delete(oldest);
                        }
                        loaderCache.current.set(cacheKey, { time: Date.now(), data: finalData });
                    }

                    let heads = state.heads;
                    try {
                        heads = await resolveHeads(matched, modules, finalData);
                    } catch {
                        // Keep the previous heads when a failed loader also
                        // breaks its head function.
                    }
                    if (id !== navigationId.current) return; // superseded
                    if (hasLoadingBoundary) {
                        setState((previous) => ({ ...previous, heads, pending: false }));
                        restoreScrollPosition();
                    } else {
                        // The held swap: flush the commit so the DOM is
                        // updated in this task, then restore the saved
                        // scroll position — both happen before the next
                        // paint, so no top-of-page frame can flash through.
                        flushSync(() => {
                            setState((previous) => ({
                                ...previous,
                                match: matched,
                                modules,
                                data: finalData,
                                heads,
                                pathname: target,
                                search: url.searchParams,
                                navigationType: options.replace ? 'replace' : 'push',
                                pending: false,
                            }));
                        });
                        if (options.scroll !== false) window.scrollTo(0, 0);
                        restoreScrollPosition();
                    }
                    return;
                }

                // navMode=server routes go through the server payload.
                const payloadPromise = fetchPayload(target, url.search, reusable);

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
                    navigation = await payloadPromise;
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
                const clientOnlyFiles =
                    (tree.clientOnlyFiles?.size ?? 0) > 0
                        ? filesOfMatch(matched).filter((file) => tree.clientOnlyFiles?.has(file))
                        : [];
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
                        const extra = Object.fromEntries(
                            extraEntries.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
                        );
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
                if (reusable.length > 0 && !navigationError && !navigation.notFound) {
                    if (id !== navigationId.current) return;
                    heads = await resolveHeads(matched, modules, data);
                }

                if (id !== navigationId.current) return; // superseded
                setState((previous) => ({
                    match: matched,
                    modules,
                    // Error/notFound fallbacks must keep the previous data so
                    // layouts above the boundary can keep rendering (a cleared
                    // data map crashes ancestor layouts mid-render).
                    data: navigationError || navigation.notFound ? previous.data : data,
                    heads: navigationError || navigation.notFound ? previous.heads : heads,
                    pathname: target,
                    search: url.searchParams,
                    navigationType: options.replace ? 'replace' : 'push',
                    error: navigationError,
                    notFound: navigation.notFound || undefined,
                }));
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
            const matched = matcher(target);
            if (!matched) return;
            void (async () => {
                // Warm the module chunk for every route; navMode=client
                // routes also prime their loaders (the next navigation
                // commits instantly, no suspense), server-mode routes warm
                // the payload cache.
                const modules = await resolveChainModules(matched, moduleLoaders, {
                    includeClientOnly: true,
                });
                const navMode = modules[matched.page.pageFile ?? '']?.config?.navMode;
                if (navMode !== 'client') {
                    void fetchPayload(target, url.search);
                    return;
                }
                const loaderContext: LoaderContext = {
                    params: matched.params,
                    request: new Request(url.href),
                    url,
                };
                const files = filesOfMatch(matched);
                const entries = await Promise.all(
                    files.map(async (file) => {
                        const loader = modules[file]?.loader;
                        if (!loader) return null;
                        try {
                            return [file, await loader(loaderContext)] as const;
                        } catch {
                            return null;
                        }
                    }),
                );
                const data = Object.fromEntries(
                    entries.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
                );
                if (Object.keys(data).length === 0) return;
                if (loaderCache.current.size >= PAYLOAD_CACHE_MAX) {
                    const oldest = loaderCache.current.keys().next().value;
                    if (oldest !== undefined) loaderCache.current.delete(oldest);
                }
                loaderCache.current.set(target + url.search, { time: Date.now(), data });
            })();
        },
        [basepath, fetchPayload, matcher, moduleLoaders, rewritePathname],
    );

    // We restore scroll positions ourselves (after the target page has
    // rendered); the browser's native restoration fires too early — while
    // the outgoing page is still visible — and reads as a stray jump.
    useEffect(() => {
        if (history !== 'browser' || !('scrollRestoration' in window.history)) return;
        const previous = window.history.scrollRestoration;
        window.history.scrollRestoration = 'manual';
        return () => {
            window.history.scrollRestoration = previous;
        };
    }, [history]);

    useEffect(() => {
        if (history === 'memory') return;
        const onPopState = () => {
            // Back/forward: never scroll — the browser restores the previous
            // scroll position natively; a scrollTo here fights it and shows
            // as a visible jump before the target page renders.
            navigate(window.location.pathname + window.location.search, {
                replace: true,
                scroll: false,
                restoreScroll: true,
            });
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
                void resolveChainModules({ page, chain: [page], params: {} } as RouteMatch, moduleLoaders, {
                    includeClientOnly: true,
                });
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
        loaderPromises: state.loaderPromises,
        loaderErrors: state.loaderErrors,
        loaderResults: loaderResults.current,
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
                    onTouchStart={() => {
                        if (prefetch) state?.prefetch?.(href);
                    }}
                    onFocus={() => {
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
