import type { RouteMatch } from '../router/matcher.ts';
import type { RouteModuleLoaders, RouteModuleMap } from './types.ts';

/** Accepted shapes for the `modules` option: resolved modules, lazy loaders, or a mix. */
export type RouteModuleInput = RouteModuleMap | RouteModuleLoaders | Record<string, unknown>;

function isLoader(value: unknown): value is () => Promise<RouteModuleMap[string]> {
    return typeof value === 'function';
}

/**
 * Resolve the route modules needed for a matched chain. Loaders are only
 * invoked for the files in the chain — the rest of the app's module graph
 * is never evaluated on the server.
 *
 * Client-only nodes are skipped by default (the server must not evaluate
 * their modules); pass `includeClientOnly` for paths that legitimately
 * need them (the client-side data endpoint).
 */
export async function resolveChainModules(
    match: RouteMatch,
    input: RouteModuleInput,
    options?: { includeClientOnly?: boolean },
): Promise<RouteModuleMap> {
    const files = match.chain.flatMap((node) => {
        return [node.rootFile, node.layoutFile, node === match.page ? node.pageFile : undefined]
            .filter((file): file is string => Boolean(file))
            .filter((file) => options?.includeClientOnly || !match.clientOnlyFiles?.has(file));
    });
    const entries = await Promise.all(
        files.map(async (file) => {
            const value = (input as Record<string, unknown>)[file];
            if (!value) return null;
            return [file, isLoader(value) ? await value() : value] as const;
        }),
    );
    const modules: RouteModuleMap = {};
    for (const entry of entries) {
        if (entry) modules[entry[0]] = entry[1] as RouteModuleMap[string];
    }
    return modules;
}
