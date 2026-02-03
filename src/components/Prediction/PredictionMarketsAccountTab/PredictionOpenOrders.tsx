'use client';

import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo, use } from 'react';

import { Loading } from '@/components/Loading.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { PredictionContext } from '@/components/Prediction/PredictionContext.js';
import { OpenOrderItem } from '@/components/Prediction/PredictionMarketsAccountTab/OpenOrderItem.js';
import { PredictionPlatform, Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { getPredictionOpenOrders } from '@/providers/prediction/getPredictionOpenOrders.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

interface PredictionOpenOrdersProps {
    platform: PredictionPlatform;
}

export const PredictionOpenOrders = memo<PredictionOpenOrdersProps>(function PredictionOpenOrders({ platform }) {
    const { market } = use(PredictionContext);
    const { currentProfileSession } = useFireflyProfileStore();

    const marketId = market?.id;
    const { data, isLoading } = useQuery({
        queryKey: [Source.Prediction, 'open-orders', platform, 'all', currentProfileSession?.profileId],
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!currentProfileSession && platform === PredictionPlatform.Polymarket && !!marketId,
        queryFn: () => getPredictionOpenOrders({ platform }),
        select: (data) => {
            const orders = data?.data || EMPTY_LIST;
            return market ? orders.filter((order) => order.market === market.conditionId) : orders;
        },
    });

    if (isLoading) return <Loading />;
    if (!marketId || !data?.length)
        return <NoResultsFallback className="m-4" message={<Trans>No open orders found.</Trans>} />;

    return (
        <div className="space-y-4 p-4">
            {data.map((order) => (
                <OpenOrderItem key={`${platform}:${order.id}`} platform={platform} order={order} />
            ))}
        </div>
    );
});
