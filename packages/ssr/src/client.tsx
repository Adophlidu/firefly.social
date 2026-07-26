import { hydrateRoot } from 'react-dom/client';

import { createMatcher } from './router/matcher.ts';
import type { RouteTree } from './router/tree.ts';
import { ClientApp, type HistoryMode } from './runtime/client-router.tsx';
import { collectHeads } from './runtime/loaders.ts';
import { stripBasepath } from './runtime/paths.ts';
import { resolveChainModules, type RouteModuleInput } from './runtime/resolve-modules.ts';
import { SSR_DATA_ELEMENT_ID, parseSsrPayload } from './runtime/serialize.ts';

export interface HydrateAppOptions {
    tree: RouteTree;
    /**
     * Route modules — lazy loaders (as emitted by the Vite plugin), resolved
     * modules, or a mix. Only the matched chain is resolved.
     */
    modules: RouteModuleInput;
    /**
     * Hydration target. Defaults to `document` (full-document hydration when
     * the root component renders `<html>`).
     */
    root?: Document | HTMLElement;
    /**
     * URL override for matching. Defaults to `location.href`. Useful when
     * the app runs inside an iframe with a memory history, where the
     * browser URL does not reflect the app route.
     */
    url?: string;
    /**
     * `browser` syncs navigation with the URL bar; `memory` keeps it fully
     * in-memory (for apps embedded in an iframe). Defaults to `browser`.
     */
    history?: HistoryMode;
    /**
     * App basepath (e.g. `/wallet-iframe`). Stripped before matching the
     * initial URL and forwarded to the client router.
     */
    basepath?: string;
    /**
     * Milliseconds to wait before showing a route's `pendingComponent`
     * during client-side navigation. Defaults to 1000; set 0 to disable.
     */
    pendingMs?: number;
    /**
     * Prefetch every static route's payload + chunk while idle. Defaults
     * to true.
     */
    prefetchAll?: boolean;
    /**
     * Rewrite the browser pathname before matching, mirroring server-side
     * middleware rewrites (e.g. locale prefixing: `/posts` → `/en/posts`).
     * Applied on hydration and every client-side navigation. The browser
     * URL itself is left untouched.
     */
    rewritePathname?: (pathname: string) => string;
    /**
     * Recoverable hydration error handler (hydrateRoot's onRecoverableError).
     * Defaults to downgrading suspense-boundary hydration failures (React
     * #419 — recoverable by client re-render) to a console warning while
     * surfacing everything else as errors.
     */
    onRecoverableError?: (error: Error) => void;
}

const SUSPENSE_HYDRATION_PATTERN = /#419|Suspense boundary/i;

function defaultRecoverableErrorHandler(error: Error): void {
    const message = String(error);
    if (SUSPENSE_HYDRATION_PATTERN.test(message)) {
        console.warn('[ssr] suspense boundary failed to hydrate; re-rendered on the client:', error);
        return;
    }
    console.error(error);
}

/**
 * Hydrate a server-rendered app: read the dehydration payload, rebuild the
 * matched element tree with the same data, and attach the client router.
 */
export async function hydrateApp(options: HydrateAppOptions): Promise<void> {
    const { tree, modules: moduleInput, root = document } = options;

    const payloadElement = document.getElementById(SSR_DATA_ELEMENT_ID);
    if (!payloadElement?.textContent) {
        throw new Error(`hydrateApp: missing #${SSR_DATA_ELEMENT_ID} payload; was the page server-rendered?`);
    }
    const payload = parseSsrPayload(payloadElement.textContent);

    const url = new URL(options.url ?? globalThis.location.href);
    const rawPathname = options.rewritePathname?.(url.pathname) ?? url.pathname;
    const pathname = stripBasepath(rawPathname, options.basepath);
    const matched = createMatcher(tree)(pathname);
    if (!matched) {
        throw new Error(`hydrateApp: no route matches ${pathname}`);
    }

    const modules = await resolveChainModules(matched, moduleInput);

    // Recompute heads from the dehydrated data so the client render matches
    // the server-rendered <head> exactly, without re-running loaders.
    const heads = collectHeads(matched, modules, payload.data);

    hydrateRoot(
        root,
        <ClientApp
            tree={tree}
            moduleLoaders={moduleInput}
            initial={{
                match: matched,
                modules,
                data: payload.data,
                heads,
                pathname,
                search: url.searchParams,
                error: payload.error ? new Error(payload.error) : undefined,
                notFound: payload.notFound || undefined,
                pending: payload.pending || undefined,
            }}
            payload={payload}
            history={options.history}
            basepath={options.basepath}
            pendingMs={options.pendingMs}
            prefetchAll={options.prefetchAll}
            rewritePathname={options.rewritePathname}
        />,
        { onRecoverableError: options.onRecoverableError ?? defaultRecoverableErrorHandler },
    );
}
