'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { BetsActivityItem } from '@/components/Bets/BetsActivityItem.js';
import { ListInPage } from '@/components/ListInPage.js';
import { Loading } from '@/components/Loading.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { getFollowingBetsList } from '@/providers/firefly/bets/getFollowingBetsList.js';
import { captureFollowingPolymarketLinkClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import type { BetsActivity } from '@/providers/types/Firefly.js';
import { BetsFilterNamespace, useBetsSourceFilterStore } from '@/store/useBetsSourceFilterStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

function getBetsActivityItem(index: number, activity: BetsActivity, onClick?: () => void) {
    return <BetsActivityItem activity={activity} key={`${activity.slug}-${index}`} onLinkClick={onClick} />;
}

export function FollowingBetsTimeline() {
    const { currentProfileSession } = useFireflyProfileStore();
    const { platforms } = useBetsSourceFilterStore(BetsFilterNamespace.Following);

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['bets', 'list', 'following', currentProfileSession?.profileId, platforms.join(',')],
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            try {
                return await getFollowingBetsList({
                    indicator,
                    platforms,
                });
            } catch {
                return createPageable([], indicator);
            }
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => data.pages.flatMap((x) => x.data),
    });

    const onBetsLinkClick = useCallback(() => {
        captureFollowingPolymarketLinkClick();
    }, []);

    if (!queryResult.isFetchingNextPage && queryResult.isFetching) {
        return <Loading />;
    }

    return (
        <ListInPage
            source={Source.Bets}
            key={Source.Bets}
            queryResult={queryResult}
            VirtualListProps={{
                useWindowScroll: true,
                listKey: `${ScrollListKey.Bets}:following`,
                computeItemKey: (index, activity) => `${activity.slug}-${index}`,
                itemContent: (index, activity) => getBetsActivityItem(index, activity, onBetsLinkClick),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
