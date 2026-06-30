import {
    createIndicator,
    createNextIndicator,
    createPageable,
    delay,
    INITIAL_PAGEABLE_PARAM,
    type Pageable,
    type PageIndicator,
    parseJson,
} from '@dimensiondev/utils';
import { compact } from 'lodash-es';

export interface MultiInfiniteQuery<T> {
    key: string;
    queryFn: (options: { pageParam?: string; signal?: AbortSignal }) => Promise<T>;
    initialPageParam?: PageIndicator;
    timeout?: number;
}

/**
 * Builds the fetch-level options (queryKey / queryFn / pagination) shared by the
 * `useMultiInfiniteQueryPageable` client hook and any server-side
 * `prefetchInfiniteQuery`. A single source of truth guarantees the dehydrated cache
 * matches the key and page shape the hook reads back, so a server-prefetched
 * multi-source list hydrates without an extra refetch.
 *
 * This module is intentionally free of React / react-query imports so it can be
 * imported into a Server Component without pulling client hooks into the server graph.
 */
export function getMultiInfiniteQueryPageableFetchOptions<D, T extends Pageable<D, PageIndicator>>(
    queryKey: unknown[],
    queries: Array<MultiInfiniteQuery<T>>,
    options?: {
        formatter?: (data: D[]) => D[];
    },
) {
    type PageParams = Record<string, PageIndicator>;
    const formatter = options?.formatter;

    return {
        queryKey,
        async queryFn({ pageParam }: { pageParam: string }) {
            const parsePageParam = parseJson<PageParams>(pageParam) ?? {};
            const queryFns = queries.map(async (query) => {
                const signal = query.timeout ? AbortSignal.timeout(query.timeout) : undefined;
                const timeout = query.timeout ? delay(query.timeout).then(() => null) : null;
                const indicator = parsePageParam[query.key];
                if (!indicator) return null;
                const indicatorId = indicator.id === INITIAL_PAGEABLE_PARAM ? undefined : indicator.id;
                return Promise.race(
                    compact([
                        timeout,
                        query
                            .queryFn({ pageParam: indicatorId, signal })
                            .then((result) => [{ key: query.key, result }]),
                    ]),
                );
            });
            const settled = await Promise.allSettled(queryFns);
            const results = compact(settled.flatMap((x) => (x.status === 'fulfilled' ? x.value : null)));
            const strIndicator = createIndicator(undefined, pageParam);
            const strNextIndicator = createNextIndicator(
                strIndicator,
                JSON.stringify(
                    results.reduce<PageParams>(
                        (acc, { key, result }) => ({
                            ...acc,
                            [key]: result?.nextIndicator as PageIndicator,
                        }),
                        {},
                    ),
                ),
            );
            const data = results.reduce<D[]>((acc, x) => acc.concat(x.result.data), []);
            return createPageable<D>(formatter ? formatter(data) : data, strIndicator, strNextIndicator) as T;
        },
        getNextPageParam(lastPage: T) {
            const next = parseJson<PageParams>(lastPage.nextIndicator?.id);
            if (!next) return;
            if (compact(Object.values(next)).length <= 0) return;
            return JSON.stringify(next);
        },
        initialPageParam: JSON.stringify(
            queries.reduce<PageParams>(
                (acc, query) => ({
                    ...acc,
                    [query.key]: query.initialPageParam ?? createIndicator(undefined, INITIAL_PAGEABLE_PARAM),
                }),
                {},
            ),
        ),
    };
}
