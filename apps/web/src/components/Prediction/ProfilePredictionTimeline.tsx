'use client';

import { SORTED_BETS_PLATFORM } from '@dimensiondev/constants/computed';
import { ScrollListKey, Source } from '@dimensiondev/enums';
import { createIndicator } from '@dimensiondev/utils';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { memo, useCallback, useMemo } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { PredictionActivityItem } from '@/components/Prediction/PredictionActivityItem.js';
import { enrichActivityWithFifa } from '@/helpers/prediction/fifaMatchResults.js';
import { useFifaMatchResults } from '@/hooks/prediction/useFifaMatchResults.js';
import { getPredictionTimelineByAddress } from '@/providers/firefly/prediction/getPredictionTimelineByAddress.js';
import { captureProfilePolymarketLinkClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import type { BetsActivity } from '@/providers/types/Firefly.js';
import { PredictionFilterNamespace, usePredictionSourceFilterStore } from '@/store/usePredictionSourceFilterStore.js';

interface ProfilePredictionTimelineProps {
    address: string;
}

function getPredictionActivityItem(data: BetsActivity, onClick?: () => void) {
    return <PredictionActivityItem activity={data} onLinkClick={onClick} />;
}

export const ProfilePredictionTimeline = memo<ProfilePredictionTimelineProps>(function ProfilePredictionTimeline({
    address,
}) {
    const { platforms } = usePredictionSourceFilterStore(PredictionFilterNamespace.Profile);
    // If all platforms are selected, we don't need to filter by platform, so we pass an empty array to the query function.
    const validPlatforms = platforms.length === SORTED_BETS_PLATFORM.length ? [] : platforms;

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['bets', 'list', 'profile', address.toLowerCase(), validPlatforms.join(',')],
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            return getPredictionTimelineByAddress({
                walletAddresses: [address],
                indicator,
                platforms: validPlatforms,
            });
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => data.pages.flatMap((x) => x.data),
    });

    // Overlay FIFA penalty-shootout data so drawn matches can render shootout dots.
    const hasSportActivity = useMemo(
        () => (queryResult.data ?? []).some((activity) => !!activity.sportData),
        [queryResult.data],
    );
    const fifaMatchResults = useFifaMatchResults({ enabled: hasSportActivity, refetchInterval: false });

    const enrichedQueryResult = useMemo(() => {
        const data = (queryResult.data ?? []).map((activity) =>
            enrichActivityWithFifa(activity, fifaMatchResults?.get(activity.topicId)),
        );
        return { ...queryResult, data };
    }, [queryResult, fifaMatchResults]);

    const onPolymarketLinkClick = useCallback(() => {
        captureProfilePolymarketLinkClick();
    }, []);

    return (
        <ListInPage
            source={Source.Prediction}
            key={Source.Prediction}
            queryResult={enrichedQueryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Prediction}:${address}`,
                computeItemKey: (index, data) => `${data.transactionHash}-${index}`,
                itemContent: (_, item) => getPredictionActivityItem(item, onPolymarketLinkClick),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
});
