import type { Pageable, PageIndicator } from '@dimensiondev/utils';
import { type InfiniteData, useSuspenseInfiniteQuery } from '@tanstack/react-query';

import {
    getMultiInfiniteQueryPageableFetchOptions,
    type MultiInfiniteQuery,
} from './getMultiInfiniteQueryPageableFetchOptions.js';

export function useMultiInfiniteQueryPageable<D, T extends Pageable<D, PageIndicator>>(
    queryKey: unknown[],
    queries: Array<MultiInfiniteQuery<T>>,
    select: (data: InfiniteData<T>) => D[],
    options?: {
        staleTime?: number;
        gcTime?: number;
        formatter?: (data: D[]) => D[];
        initialData?: InfiniteData<T, string>;
    },
) {
    return useSuspenseInfiniteQuery({
        ...getMultiInfiniteQueryPageableFetchOptions<D, T>(queryKey, queries, { formatter: options?.formatter }),
        select,
        staleTime: options?.staleTime,
        gcTime: options?.gcTime,
        initialData: options?.initialData,
    });
}
