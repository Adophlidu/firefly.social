'use client';

import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { Loading } from '@/components/Loading.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { OpenOrderItem } from '@/components/Prediction/PredictionMarketsAccountTab/OpenOrderItem.js';
import { PredictionPlatform, Source } from '@/constants/enum.js';
import { STALE_TIMES } from '@/constants/query.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { getPredictionOpenOrders } from '@/providers/prediction/getPredictionOpenOrders.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';
import { type BetsMarketDataForUI } from '@/types/prediction.js';

interface PredictionOpenOrdersProps {
    platform: PredictionPlatform;
    markets: BetsMarketDataForUI[];
}

export const PredictionOpenOrders = memo<PredictionOpenOrdersProps>(function PredictionOpenOrders({
    platform,
    markets,
}) {
    const { currentProfileSession } = useFireflyProfileStore();

    const marketIds = markets.map((x) => x.conditionId);
    const { data, isLoading } = useQuery({
        queryKey: [Source.Prediction, 'open-orders', platform, 'all', currentProfileSession?.profileId],
        staleTime: STALE_TIMES.MINUTE_5,

        enabled: !!currentProfileSession && platform === PredictionPlatform.Polymarket,
        queryFn: () => getPredictionOpenOrders({ platform }),
        select: (data) => {
            const orders = data?.data || EMPTY_LIST;
            return orders.filter((order) => marketIds.includes(order.market));
        },
    });

    if (isLoading) return <Loading minHeight={274} />;
    if (!data?.length)
        return <NoResultsFallback className="m-4 h-[274px]" message={<Trans>No open orders found.</Trans>} />;

    return (
        <div className="space-y-4 px-4 pt-4">
            {data.map((order) => (
                <OpenOrderItem key={`${platform}:${order.id}`} platform={platform} order={order} />
            ))}
        </div>
    );
});
