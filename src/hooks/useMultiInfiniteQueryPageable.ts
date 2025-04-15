import { delay } from '@masknet/kit';
import { type InfiniteData, useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';

import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { parseJSON } from '@/helpers/parseJSON.js';

const INITIAL_PARAM = 'INITIAL_PARAM';

export function useMultiInfiniteQueryPageable<D, T extends Pageable<D, PageIndicator>>(
    queryKey: unknown[],
    queries: Array<{
        key: string;
        queryFn: (options: { pageParam?: string }) => Promise<T>;
        initialPageParam?: PageIndicator;
        timeout?: number; // ms
    }>,
    select: (data: InfiniteData<T>) => D[],
) {
    type PageParams = Record<string, PageIndicator>;

    return useSuspenseInfiniteQuery({
        queryKey,
        async queryFn({ pageParam }) {
            const parsePageParam = parseJSON<PageParams>(pageParam) ?? {};
            const queryFns = queries.map(async (query) => {
                const timeout = delay(query.timeout ?? 10000).then(() => null);
                const indicator = parsePageParam[query.key];
                if (!indicator) return null;
                const indicatorId = indicator.id === INITIAL_PARAM ? undefined : indicator.id;
                return Promise.race([
                    timeout,
                    query.queryFn({ pageParam: indicatorId }).then((result) => [{ key: query.key, result }]),
                ]);
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
            return createPageable<D>(data, strIndicator, strNextIndicator) as T;
        },
        getNextPageParam(lastPage) {
            const next = parseJSON<PageParams>(lastPage.nextIndicator?.id);
            if (!next) return;
            if (compact(Object.values(next)).length <= 0) return;
            return JSON.stringify(next);
        },
        initialPageParam: JSON.stringify(
            queries.reduce<PageParams>(
                (acc, query) => ({
                    ...acc,
                    [query.key]: query.initialPageParam ?? createIndicator(undefined, INITIAL_PARAM),
                }),
                {},
            ),
        ),
        select,
    });
}
