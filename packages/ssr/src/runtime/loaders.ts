import type { RouteMatch } from '../router/matcher.ts';
import type { RouteNode } from '../router/tree.ts';
import type { HeadDescriptor, LoaderContext, RouteModuleMap } from './types.ts';

export interface ResolvedChain {
    /** Loader data keyed by route file path. */
    data: Record<string, unknown>;
    /** Head descriptors, root first. */
    heads: HeadDescriptor[];
}

/**
 * The module files a node contributes to the render chain, in render order.
 * The page component is only contributed when the node is the matched page —
 * a node carrying both a layout and an index page renders the page only for
 * its own exact URL, but renders the layout for all descendant URLs.
 */
export function filesOfNode(node: RouteNode, isMatchedPage: boolean): string[] {
    return [node.rootFile, node.layoutFile, isMatchedPage ? node.pageFile : undefined].filter((file): file is string =>
        Boolean(file),
    );
}

/** All files of the matched chain, root first. */
export function filesOfMatch(match: RouteMatch): string[] {
    return match.chain.flatMap((node) => filesOfNode(node, node === match.page));
}

/**
 * Run the loaders of every module in the matched chain (in parallel), then
 * collect head descriptors with the resolved data. Files in `skipLoaders`
 * keep neither loader nor data — used by the `x-ssr-have` protocol, where
 * the client already holds fresh data for those files.
 */
export async function resolveChain(
    match: RouteMatch,
    modules: RouteModuleMap,
    context: Omit<LoaderContext, 'params'>,
    skipLoaders?: ReadonlySet<string>,
): Promise<ResolvedChain> {
    const loaderContext: LoaderContext = {
        params: match.params,
        request: context.request,
        url: context.url,
        env: context.env,
        ctx: context.ctx,
    };

    const dataEntries = await Promise.all(
        filesOfMatch(match).map(async (file) => {
            const routeModule = modules[file];
            if (!routeModule?.loader || skipLoaders?.has(file)) return null;
            return [file, await routeModule.loader(loaderContext)] as const;
        }),
    );

    const data: Record<string, unknown> = {};
    for (const entry of dataEntries) {
        if (entry) data[entry[0]] = entry[1];
    }

    return { data, heads: await resolveHeads(match, modules, data) };
}

/**
 * Evaluate every module's `head()` against the resolved loader data,
 * awaiting async heads. Used on the server, where promises must never be
 * left floating (see the `RouteModule.head` contract).
 */
export async function resolveHeads(
    match: RouteMatch,
    modules: RouteModuleMap,
    data: Record<string, unknown>,
): Promise<HeadDescriptor[]> {
    const heads = await Promise.all(
        filesOfMatch(match).map(async (file) => {
            const routeModule = modules[file];
            if (!routeModule?.head) return null;
            return routeModule.head({ data: data[file], allData: data, params: match.params });
        }),
    );
    return heads.filter((head): head is HeadDescriptor => Boolean(head));
}

/**
 * Collect head descriptors from already-resolved loader data. Only valid for
 * synchronous heads — prefer `resolveHeads` on the server. Kept for client
 * hydration fallbacks (older payloads without embedded heads).
 */
export function collectHeads(
    match: RouteMatch,
    modules: RouteModuleMap,
    data: Record<string, unknown>,
): HeadDescriptor[] {
    const heads: HeadDescriptor[] = [];
    for (const file of filesOfMatch(match)) {
        const routeModule = modules[file];
        if (!routeModule?.head) continue;
        const head = routeModule.head({ data: data[file], params: match.params });
        // Async heads cannot be collected synchronously; they are resolved
        // server-side and embedded in the payload instead.
        if (head instanceof Promise) continue;
        heads.push(head);
    }
    return heads;
}
