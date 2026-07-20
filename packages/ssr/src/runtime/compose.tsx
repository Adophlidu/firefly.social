import { RouterContext, type RouterState } from './context.ts';
import { ErrorBoundary } from './error-boundary.tsx';
import { filesOfMatch } from './loaders.ts';
import { SSR_DATA_ELEMENT_ID, serializeForHtml, type SsrPayload } from './serialize.ts';
import type { RouteModuleMap } from './types.ts';
import type { RouteMatch } from '../router/matcher.ts';
import type { HeadDescriptor } from './types.ts';
import type { ComponentType, ReactElement, ReactNode } from 'react';

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
                const titles = state.heads.map((head) => head.title).filter(Boolean);
                const title = titles.at(-1);
                return (
                    <>
                        <DevBootstrap dev={state.payload?.dev} />
                        {title ? <title>{title}</title> : null}
                        {state.heads.flatMap((head, index) =>
                            (head.meta ?? []).map((meta, metaIndex) => (
                                <meta key={`${index}:${metaIndex}`} data-ssr-managed="" {...meta} />
                            )),
                        )}
                        {state.heads.flatMap((head, index) =>
                            (head.links ?? []).map((link, linkIndex) => (
                                <link key={`${index}:${linkIndex}`} data-ssr-managed="" {...link} />
                            )),
                        )}
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
}

interface ChainEntry {
    Component: ComponentType<{ children?: ReactNode; error?: Error }>;
    errorComponent?: ComponentType<{ error: Error }>;
}

/**
 * Find the nearest boundary component declared along the matched chain,
 * searching from the page outward (page file, then its layout, then
 * ancestors up to the root).
 */
export function findBoundaryComponent(
    match: RouteMatch,
    modules: RouteModuleMap,
    kind: 'error' | 'notFound' | 'pending',
): ComponentType | undefined {
    for (let index = match.chain.length - 1; index >= 0; index -= 1) {
        const node = match.chain[index];
        const files =
            node === match.page
                ? [node.pageFile, node.layoutFile, node.rootFile]
                : [node.layoutFile, node.rootFile];
        for (const file of files) {
            const routeModule = file ? modules[file] : undefined;
            const boundary =
                kind === 'error'
                    ? routeModule?.errorComponent
                    : kind === 'notFound'
                      ? routeModule?.notFoundComponent
                      : routeModule?.pendingComponent;
            if (boundary) return boundary as ComponentType;
        }
    }
    return undefined;
}

function entriesOfMatch(options: ComposeOptions): ChainEntry[] {
    const { match, modules } = options;
    const entries = match.chain.flatMap((node): ChainEntry[] => {
        const files = [node.rootFile, node.layoutFile, node === match.page ? node.pageFile : undefined];
        return files.flatMap((file) => {
            const routeModule = file ? modules[file] : undefined;
            if (!routeModule?.default) return [];
            return [{ Component: routeModule.default, errorComponent: routeModule.errorComponent }];
        });
    });
    if (options.terminalComponent) {
        // Replace the page when it contributed a component; append the
        // fallback otherwise (e.g. client-only pages render nothing on the
        // server, so the pending fallback goes after the layouts).
        const pageHasComponent = Boolean(modules[match.page.pageFile ?? '']?.default);
        if (pageHasComponent && entries.length > 0) {
            entries[entries.length - 1] = { Component: options.terminalComponent };
        } else {
            entries.push({ Component: options.terminalComponent });
        }
    }
    return entries;
}

/**
 * Compose the matched chain into a React element tree: the root wraps the
 * outermost layout, which wraps the next, down to the page. Nodes without a
 * component (virtual grouping nodes) are skipped; a node carrying both a
 * layout and a page contributes both components, layout outside page.
 * Modules declaring `errorComponent` get a React error boundary around
 * their subtree.
 */
export function composeMatch(options: ComposeOptions): ReactElement {
    const { match } = options;

    const entries = entriesOfMatch(options);

    let tree: ReactNode = null;
    for (let index = entries.length - 1; index >= 0; index -= 1) {
        const { Component, errorComponent: Fallback } = entries[index];
        const children = Fallback ? <ErrorBoundary Fallback={Fallback}>{tree}</ErrorBoundary> : tree;
        // A terminal errorComponent receives the error as a prop.
        const errorProps =
            options.terminalComponent && options.error && index === entries.length - 1
                ? { error: options.error }
                : {};
        tree = <Component {...errorProps}>{children}</Component>;
    }

    const state: RouterState = {
        pathname: options.pathname,
        search: options.search,
        params: match.params,
        data: options.data,
        files: filesOfMatch(match),
        heads: options.heads,
        error: options.error,
        notFound: options.notFound,
        basepath: options.basepath,
        clientAssets: options.clientAssets,
        payload: options.payload,
        navigationType: options.navigationType,
        navigate: options.navigate,
        prefetch: options.prefetch,
    };

    return <RouterContext.Provider value={state}>{tree}</RouterContext.Provider>;
}
