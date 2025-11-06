'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { Loading } from '@/components/Loading.js';
import { PolymarketActivityItem } from '@/components/Polymarket/PolymarketActivityItem.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { getFollowingPolymarketTimeline } from '@/providers/firefly/polymarket/getFollowingPolymarketTimeline.js';
import { captureFollowingPolymarketLinkClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import type { PolymarketActivity } from '@/providers/types/Firefly.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

function getPolymarketActivityItem(index: number, activity: PolymarketActivity, onClick?: () => void) {
    return (
        <PolymarketActivityItem activity={activity} key={`${activity.slug}-${index}`} onPolymarketLinkClick={onClick} />
    );
}

export function FollowingPolymarketList() {
    const { currentProfileSession } = useFireflyProfileStore();
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['polymarket', 'following-list', currentProfileSession?.profileId],
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            try {
                return await getFollowingPolymarketTimeline('all', indicator);
            } catch {
                return createPageable([], indicator);
            }
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => data.pages.flatMap((x) => x.data),
    });

    const onPolymarketLinkClick = useCallback(() => {
        captureFollowingPolymarketLinkClick();
    }, []);

    if (!queryResult.isFetchingNextPage && queryResult.isFetching) {
        return <Loading />;
    }

    return (
        <ListInPage
            source={Source.Polymarket}
            key={Source.Polymarket}
            queryResult={queryResult}
            VirtualListProps={{
                useWindowScroll: true,
                listKey: `${ScrollListKey.Polymarket}:following`,
                computeItemKey: (index, activity) => `${activity.slug}-${index}`,
                itemContent: (index, activity) => getPolymarketActivityItem(index, activity, onPolymarketLinkClick),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
