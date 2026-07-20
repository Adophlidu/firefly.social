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
    return [node.rootFile, node.layoutFile, isMatchedPage ? node.pageFile : undefined].filter(
        (file): file is string => Boolean(file),
    );
}

/** All files of the matched chain, root first. */
export function filesOfMatch(match: RouteMatch): string[] {
    return match.chain.flatMap((node) => filesOfNode(node, node === match.page));
}

/**
 * Run the loaders of every module in the matched chain (in parallel), then
 * collect head descriptors with the resolved data.
 */
export async function resolveChain(
    match: RouteMatch,
    modules: RouteModuleMap,
    context: Omit<LoaderContext, 'params'>,
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
            if (!routeModule?.loader) return null;
            return [file, await routeModule.loader(loaderContext)] as const;
        }),
    );

    const data: Record<string, unknown> = {};
    for (const entry of dataEntries) {
        if (entry) data[entry[0]] = entry[1];
    }

    return { data, heads: collectHeads(match, modules, data) };
}

/**
 * Collect head descriptors from already-resolved loader data. Used on the
 * client during hydration, where loaders must not run again.
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
        heads.push(routeModule.head({ data: data[file], params: match.params }));
    }
    return heads;
}
