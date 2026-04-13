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
import { type InfiniteData, useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';

export function useMultiInfiniteQueryPageable<D, T extends Pageable<D, PageIndicator>>(
    queryKey: unknown[],
    queries: Array<{
        key: string;
        queryFn: (options: { pageParam?: string; signal?: AbortSignal }) => Promise<T>;
        initialPageParam?: PageIndicator;
        timeout?: number;
    }>,
    select: (data: InfiniteData<T>) => D[],
    options?: {
        staleTime?: number;
        gcTime?: number;
        formatter?: (data: D[]) => D[];
    },
) {
    type PageParams = Record<string, PageIndicator>;
    const formatter = options?.formatter;

    return useSuspenseInfiniteQuery({
        queryKey,
        async queryFn({ pageParam }) {
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
        getNextPageParam(lastPage) {
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
        select,
        staleTime: options?.staleTime,
        gcTime: options?.gcTime,
    });
}
