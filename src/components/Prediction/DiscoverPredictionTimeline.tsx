'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { ListInPage } from '@/components/ListInPage.js';
import { PredictionActivityItem } from '@/components/Prediction/PredictionActivityItem.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { getDiscoverPredictionList } from '@/providers/firefly/prediction/getDiscoverPredictionList.js';
import { type BetsActivity } from '@/providers/types/Firefly.js';
import { PredictionFilterNamespace, usePredictionSourceFilterStore } from '@/store/usePredictionSourceFilterStore.js';

function getPredictionActivityItem(index: number, activity: BetsActivity, onClick?: () => void) {
    return <PredictionActivityItem activity={activity} key={`${activity.slug}-${index}`} onLinkClick={onClick} />;
}

export function DiscoverPredictionTimeline() {
    const { platforms } = usePredictionSourceFilterStore(PredictionFilterNamespace.Discover);

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['bets', 'list', 'discover', platforms.join(',')],
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            try {
                return await getDiscoverPredictionList({
                    indicator,
                    platform: platforms,
                });
            } catch {
                return createPageable([], indicator);
            }
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => data.pages.flatMap((x) => x.data),
    });

    return (
        <ListInPage
            source={Source.Prediction}
            key={Source.Prediction}
            queryResult={queryResult}
            VirtualListProps={{
                useWindowScroll: true,
                listKey: `${ScrollListKey.Bets}:discover`,
                computeItemKey: (index, activity) => `${activity.slug}-${index}`,
                itemContent: (index, activity) => getPredictionActivityItem(index, activity),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
