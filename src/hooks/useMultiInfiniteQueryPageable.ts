import { delay } from '@masknet/kit';
import { EMPTY_LIST } from '@masknet/shared-base';
import { type InfiniteData, useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';

import { createIndicator, createPageable, type Pageable, type PageIndicator } from '@/helpers/pageable.js';

const INITIAL_PARAM = 'INITIAL_PARAM';

export function useMultiInfiniteQueryPageable<D, T extends Pageable<D, PageIndicator>>(
    queryKey: unknown[],
    queries: Array<{
        key: string;
        queryFn: (options: { pageParam?: string }) => Promise<T>;
        initialPageParam?: PageIndicator;
        timeout?: number; // ms
    }>,
    select: (data: InfiniteData<Record<string, T>>) => D[],
) {
    type PageParams = Record<string, PageIndicator>;
    type Data = Record<string, T>;

    return useSuspenseInfiniteQuery({
        queryKey,
        async queryFn({ pageParam }) {
            const queryFns = queries.map(async (query) => {
                const timeout = delay(query.timeout ?? 8000).then(() => null);
                const indicator = (pageParam as PageParams)?.[query.key];
                if (!indicator) return createPageable(EMPTY_LIST, indicator);
                const indicatorId = indicator.id === INITIAL_PARAM ? undefined : indicator.id;
                return Promise.race([
                    timeout,
                    query.queryFn({ pageParam: indicatorId }).then((x) => ({ [query.key]: x })),
                ]);
            });
            const settled = await Promise.allSettled(queryFns as Array<Promise<Data | null>>);
            return compact(settled.map((x) => (x.status === 'fulfilled' ? x.value : null))).reduce<Data>(
                (acc, query) => ({
                    ...acc,
                    ...query,
                }),
                {},
            );
        },
        getNextPageParam(lastPage): PageParams | undefined {
            const next = Object.entries(lastPage).reduce<Record<string, PageIndicator | undefined>>(
                (acc, [key, page]) => ({
                    ...acc,
                    [key]: page.nextIndicator,
                }),
                {},
            );
            if (compact(Object.values(next)).length <= 0) return;
            return next as PageParams;
        },
        initialPageParam: queries.reduce<PageParams>(
            (acc, query) => ({
                ...acc,
                [query.key]: query.initialPageParam ?? createIndicator(undefined, INITIAL_PARAM),
            }),
            {},
        ),
        select,
    });
}
