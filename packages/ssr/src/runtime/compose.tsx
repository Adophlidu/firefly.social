import type { ComponentType, ReactElement, ReactNode } from 'react';
import { Suspense } from 'react';

import type { RouteMatch } from '../router/matcher.ts';
import { RouterContext, type RouterState } from './context.ts';
import { ErrorBoundary } from './error-boundary.tsx';
import { absolutizeHeadUrl, flattenHeads } from './head-manager.ts';
import { filesOfMatch } from './loaders.ts';
import { serializeForHtml, SSR_DATA_ELEMENT_ID, type SsrPayload } from './serialize.ts';
import { collectSlots } from './slot.tsx';
import type { HeadDescriptor, RouteModuleMap } from './types.ts';

function viteBaseUrl(): string {
    const base = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
    return base.endsWith('/') ? base.slice(0, -1) : base;
}

/**
 * Vite dev bootstrap: HMR client + React Fast Refresh preamble. Rendered as
 * part of the React tree (both server and client) so hydration stays
 * consistent — the dev flag comes from the dehydration payload, which the
 * server writes, so both sides always agree.
 */
function DevBootstrap(props: { dev?: boolean }): ReactElement | null {
    if (!props.dev) return null;
    const base = viteBaseUrl();
    const preamble = [
        `import RefreshRuntime from ${JSON.stringify(`${base}/@react-refresh`)};`,
        `RefreshRuntime.injectIntoGlobalHook(window);`,
        `window.$RefreshReg$ = () => {};`,
        `window.$RefreshSig$ = () => (type) => type;`,
        `window.__vite_plugin_react_preamble_installed__ = true;`,
    ].join('\n');
    return (
        <>
            <script type="module" src={`${base}/@vite/client`} />
            <script type="module" dangerouslySetInnerHTML={{ __html: preamble }} />
        </>
    );
}

/**
 * Renders the collected head descriptors. Place once inside the root
 * component's `<head>`.
 */
export function HeadOutlet(): ReactElement {
    return (
        <RouterContext.Consumer>
            {(state) => {
                if (!state) return null;
                const { title, meta, links } = flattenHeads(state.heads);
                const origin = state.origin;
                return (
                    <>
                        <DevBootstrap dev={state.payload?.dev} />
                        {title ? <title>{title}</title> : null}
                        {meta.map((entry, index) => (
                            <meta
                                key={index}
                                data-ssr-managed=""
                                {...entry}
                                content={absolutizeHeadUrl(entry.content, origin)}
                            />
                        ))}
                        {links.map((entry, index) => (
                            <link
                                key={index}
                                data-ssr-managed=""
                                {...entry}
                                href={absolutizeHeadUrl(entry.href, origin)}
                            />
                        ))}
                    </>
                );
            }}
        </RouterContext.Consumer>
    );
}

/**
 * Renders the dehydration payload `<script>` tag. Place once inside the
 * root component's `<body>` — like `<HeadOutlet>`, it is explicit so that
 * wrapper components which gate their children during SSR cannot
 * accidentally swallow the payload (hydration depends on it).
 */
export function SsrDataOutlet(): ReactElement {
    return (
        <RouterContext.Consumer>
            {(state) => {
                if (!state?.payload) return null;
                return (
                    <script
                        id={SSR_DATA_ELEMENT_ID}
                        type="application/json"
                        dangerouslySetInnerHTML={{ __html: serializeForHtml(state.payload) }}
                    />
                );
            }}
        </RouterContext.Consumer>
    );
}

export interface ComposeOptions {
    match: RouteMatch;
    modules: RouteModuleMap;
    /** Loader data keyed by route file path. */
    data: Record<string, unknown>;
    heads: HeadDescriptor[];
    /** The app-relative URL pathname, exposed through router state. */
    pathname: string;
    /** The current URL search params, exposed through router state. */
    search: URLSearchParams;
    /** The dehydration payload, exposed through router state for `<SsrDataOutlet>`. */
    payload?: SsrPayload;
    /** App basepath, exposed through router state (e.g. for `<Link>`). */
    basepath?: string;
    /** Serving origin, exposed through router state to absolutize relative head URLs. */
    origin?: string;
    /** Client assets, exposed through router state for `<ClientScripts>`/`<ClientStyles>`. */
    clientAssets?: import('./assets.tsx').ClientAssets;
    /** Client-only: navigation functions exposed through router state. */
    navigate?: (to: string) => void;
    prefetch?: (to: string) => void;
    /** How the current location was reached (client-side navigations only). */
    navigationType?: 'push' | 'replace';
    /**
     * Render this component in place of the page (innermost) component —
     * used for error/notFound/pending fallbacks.
     */
    terminalComponent?: ComponentType;
    /** Loader error being presented through an error boundary. */
    error?: Error;
    /** True when presenting a `notFoundComponent` fallback. */
    notFound?: boolean;
    /** In-flight loader promises (instant client-side transitions). */
    loaderPromises?: Record<string, Promise<unknown>>;
    /** Rejected loader errors (instant client-side transitions). */
    loaderErrors?: Record<string, unknown>;
    /** Synchronously-updated loader results (see useLoaderData). */
    loaderResults?: Record<string, unknown>;
}

function NullComponent(): null {
    return null;
}

interface ChainEntry {
    /** The route file this entry was composed from (drives Suspense keys). */
    file?: string;
    /**
     * Suspense key: the route file plus a fingerprint of the params this
     * route node owns (the param/catchall segments up to its depth). A
     * navigation to a different entity on the same route file (profile A →
     * profile B) therefore mounts a FRESH boundary that falls back to the
     * loading component, instead of React reusing the same-keyed boundary
     * and keeping the previous entity's content visible over the new URL.
     * Navigations that only change deeper segments (tab switches) keep the
     * boundary and its state.
     */
    key: string;
    Component: ComponentType<{ children?: ReactNode; error?: Error }>;
    errorComponent?: ComponentType<{ error: Error }>;
    /** Loading fallback for instant transitions (loader suspense during navigation). */
    loadingComponent?: ComponentType;
}

/**
 * The loading boundary a chain file falls back to when its loader suspends
 * during an instant (client-side) transition: its own `loadingComponent`,
 * else the nearest ancestor's, else nothing.
 */
function loadingFallbackFor(match: RouteMatch, modules: RouteModuleMap, file: string): ComponentType | undefined {
    const files = filesOfMatch(match);
    const index = files.indexOf(file);
    for (let i = index; i >= 0; i -= 1) {
        const boundary = modules[files[i]]?.loadingComponent ?? modules[files[i]]?.pendingComponent;
        if (boundary) return boundary as ComponentType;
    }
    return undefined;
}

/**
 * Find the nearest boundary component declared along the matched chain,
 * searching from the page outward (page file, then its layout, then
 * ancestors up to the root).
 */
export function findBoundaryComponent(
    match: RouteMatch,
    modules: RouteModuleMap,
    kind: 'error' | 'notFound' | 'pending' | 'loading',
): ComponentType | undefined {
    for (let index = match.chain.length - 1; index >= 0; index -= 1) {
        const node = match.chain[index];
        const files =
            node === match.page ? [node.pageFile, node.layoutFile, node.rootFile] : [node.layoutFile, node.rootFile];
        for (const file of files) {
            const routeModule = file ? modules[file] : undefined;
            const boundary =
                kind === 'error'
                    ? routeModule?.errorComponent
                    : kind === 'notFound'
                      ? routeModule?.notFoundComponent
                      : kind === 'loading'
                        ? (routeModule?.loadingComponent ?? routeModule?.pendingComponent)
                        : routeModule?.pendingComponent;
            if (boundary) return boundary as ComponentType;
        }
    }

    return undefined;
}

function entriesOfMatch(options: ComposeOptions): ChainEntry[] {
    const { match } = options;
    const entries = match.chain.flatMap((node): ChainEntry[] => {
        // Params owned by this node: the param/catchall segments from the
        // root down to its depth (pathless groups own nothing).
        const ownedParams = JSON.stringify(
            node.fullSegments
                .filter((segment) => segment.type === 'param' || segment.type === 'catchall')
                .map((segment) => [segment.name, match.params[segment.name] ?? '']),
        );
        const files = [node.rootFile, node.layoutFile, node === match.page ? node.pageFile : undefined];
        return files.flatMap((file) => {
            const routeModule = file ? options.modules[file] : undefined;
            if (!routeModule?.default) return [];
            return [
                {
                    file,
                    key: `${file}:${ownedParams}`,
                    Component: routeModule.default,
                    errorComponent: routeModule.errorComponent,
                    loadingComponent: file ? loadingFallbackFor(match, options.modules, file) : undefined,
                },
            ];
        });
    });
    if (options.terminalComponent) {
        // Replace the page when it contributed a component; append the
        // fallback otherwise (e.g. client-only pages render nothing on the
        // server, so the pending fallback goes after the layouts).
        const pageHasComponent = Boolean(options.modules[match.page.pageFile ?? '']?.default);
        if (pageHasComponent && entries.length > 0) {
            entries[entries.length - 1] = { ...entries[entries.length - 1], Component: options.terminalComponent };
        } else {
            const ownedParams = JSON.stringify(
                match.page.fullSegments
                    .filter((segment) => segment.type === 'param' || segment.type === 'catchall')
                    .map((segment) => [segment.name, match.params[segment.name] ?? '']),
            );
            entries.push({
                key: `terminal:${ownedParams}`,
                Component: options.terminalComponent,
            });
        }
    }
    return entries;
}

/**
 * Compose the matched chain into a React element tree: the root wraps the
 * outermost layout, which wraps the next, down to the page. Nodes without a
 * component (virtual grouping nodes) are skipped; a node carrying both a
 * layout and a page contributes both components, layout outside page.
 * Every component gets its own Suspense + error boundary pair around it, so
 * instant (client-side) transitions can mount the chain before loaders
 * settle: a component whose loader is in flight suspends to ITS loading
 * boundary, a rejected loader rethrows into ITS errorComponent.
 */
export function composeMatch(options: ComposeOptions): ReactElement {
    const { match } = options;

    const entries = entriesOfMatch(options);

    let tree: ReactNode = null;
    for (let index = entries.length - 1; index >= 0; index -= 1) {
        const { key, Component, errorComponent: Fallback, loadingComponent } = entries[index];
        // A terminal errorComponent receives the error as a prop.
        const errorProps =
            options.terminalComponent && options.error && index === entries.length - 1 ? { error: options.error } : {};
        const content = <Component {...errorProps}>{tree}</Component>;
        const guarded = Fallback ? <ErrorBoundary Fallback={Fallback}>{content}</ErrorBoundary> : content;
        // The outermost entry renders the full document (<html>) — a Suspense
        // boundary around it emits boundary comments outside <html>, which the
        // HTML parser relocates and hydration mismatches (#418). The root
        // keeps its error boundary only; root loaders are expected to be
        // reused across navigations (no suspension here).
        if (index === 0) {
            tree = guarded;
            continue;
        }
        const LoadingFallback = loadingComponent ?? NullComponent;
        // Keyed by route file + the params the route node owns: a navigation
        // to a different entity on the same route files (profile A → profile
        // B) swaps in a fresh boundary, so a suspending loader falls back to
        // the loading component instead of React keeping the PREVIOUS
        // entity's content visible over the new URL (boundaries never
        // re-hide revealed content). Navigations that only change deeper
        // segments (tab switches) keep their key and their state.
        tree = (
            <Suspense key={key ?? index} fallback={<LoadingFallback />}>
                {guarded}
            </Suspense>
        );
    }

    const state: RouterState = {
        pathname: options.pathname,
        search: options.search,
        params: match.params,
        data: options.data,
        files: filesOfMatch(match),
        heads: options.heads,
        slots: collectSlots(filesOfMatch(match), options.modules),
        error: options.error,
        notFound: options.notFound,
        loaderPromises: options.loaderPromises,
        loaderErrors: options.loaderErrors,
        loaderResults: options.loaderResults,
        basepath: options.basepath,
        origin: options.origin,
        clientAssets: options.clientAssets,
        payload: options.payload,
        navigationType: options.navigationType,
        navigate: options.navigate,
        prefetch: options.prefetch,
    };

    return <RouterContext.Provider value={state}>{tree}</RouterContext.Provider>;
}
