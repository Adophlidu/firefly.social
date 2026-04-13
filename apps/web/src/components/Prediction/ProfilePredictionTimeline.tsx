'use client';

import { createIndicator } from '@dimensiondev/utils';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { memo, useCallback } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { PredictionActivityItem } from '@/components/Prediction/PredictionActivityItem.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
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

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['bets', 'list', 'profile', address.toLowerCase(), platforms.join(',')],
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            return getPredictionTimelineByAddress({
                walletAddresses: [address],
                indicator,
                platforms,
            });
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => data.pages.flatMap((x) => x.data),
    });

    const onPolymarketLinkClick = useCallback(() => {
        captureProfilePolymarketLinkClick();
    }, []);

    return (
        <ListInPage
            source={Source.Prediction}
            key={Source.Prediction}
            queryResult={queryResult}
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
