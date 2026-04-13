import { createIndicator } from '@dimensiondev/utils';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { first } from 'lodash-es';
import { useCallback, useMemo } from 'react';

import { getClaimHistory } from '@/providers/firefly/red-packet/getClaimHistory.js';

export function useEthereumClaimedInfo(rpid: string) {
    const {
        data: claimData,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
    } = useSuspenseInfiniteQuery({
        queryKey: ['fireflyClaimHistory', rpid],
        initialPageParam: '',
        queryFn: async ({ pageParam }) => {
            return getClaimHistory(rpid, createIndicator(undefined, pageParam as string));
        },
        getNextPageParam: (lastPage) => lastPage?.cursor,
    });

    const onEndReached = useCallback(async () => {
        if (!hasNextPage || isFetching || isFetchingNextPage) return;
        await fetchNextPage();
    }, [fetchNextPage, hasNextPage, isFetching, isFetchingNextPage]);

    const { claimInfo, claimList } = useMemo(
        () => ({ claimList: claimData?.pages.flatMap((x) => x?.list) ?? [], claimInfo: first(claimData?.pages) }),
        [claimData],
    );

    return { claimInfo, claimList, onEndReached };
}
