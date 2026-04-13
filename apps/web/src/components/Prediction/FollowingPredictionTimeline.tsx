'use client';

import { createIndicator, createPageable } from '@dimensiondev/utils';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { ListInPage } from '@/components/ListInPage.js';
import { Loading } from '@/components/Loading.js';
import { PredictionActivityItem } from '@/components/Prediction/PredictionActivityItem.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { getFollowingPredictionList } from '@/providers/firefly/prediction/getFollowingPredictionList.js';
import { captureFollowingPredictionsClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import type { BetsActivity } from '@/providers/types/Firefly.js';
import { PredictionFilterNamespace, usePredictionSourceFilterStore } from '@/store/usePredictionSourceFilterStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

function getPredictionActivityItem(index: number, activity: BetsActivity, onClick?: () => void) {
    return <PredictionActivityItem activity={activity} key={`${activity.slug}-${index}`} onLinkClick={onClick} />;
}

export function FollowingPredictionTimeline() {
    const { currentProfileSession } = useFireflyProfileStore();
    const { platforms } = usePredictionSourceFilterStore(PredictionFilterNamespace.Following);

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['bets', 'list', 'following', currentProfileSession?.profileId, platforms.join(',')],
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            try {
                return await getFollowingPredictionList({
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

    if (!queryResult.isFetchingNextPage && queryResult.isFetching) {
        return <Loading />;
    }

    return (
        <ListInPage
            source={Source.Prediction}
            key={Source.Prediction}
            queryResult={queryResult}
            VirtualListProps={{
                useWindowScroll: true,
                listKey: `${ScrollListKey.Prediction}:following`,
                computeItemKey: (index, activity) => `${activity.slug}-${index}`,
                itemContent: (index, activity) =>
                    getPredictionActivityItem(index, activity, captureFollowingPredictionsClick),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
