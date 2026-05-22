'use client';

import { EMPTY_LIST } from '@dimensiondev/constants';
import { PredictionPlatform, Source } from '@dimensiondev/enums';
import { skipToken, useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { memo, use, useMemo, useState } from 'react';

import { PredictionContext } from '@/components/Prediction/PredictionContext.js';
import { MarketsAccountDataTab } from '@/components/Prediction/PredictionMarketsAccountTab/MarketsAccountDataTab.js';
import { MarketsAccountDataTabContent } from '@/components/Prediction/PredictionMarketsAccountTab/MarketsAccountDataTabContent.js';
import { STALE_TIMES } from '@/constants/query.js';
import { getAccountMarketPositions } from '@/providers/firefly/prediction/getAccountMarketPositions.js';
import { getPredictionOpenOrders } from '@/providers/prediction/getPredictionOpenOrders.js';
import { MarketsAccountTabType } from '@/providers/prediction/polymarket/constants.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

interface PredictionMarketsAccountTabProps {
    platform: PredictionPlatform;
    eventSlug?: string;
    marketsContent?: ReactNode;
}

export const PredictionMarketsAccountTab = memo<PredictionMarketsAccountTabProps>(function PredictionMarketsAccountTab({
    eventSlug,
    marketsContent,
    platform,
}) {
    const { event } = use(PredictionContext);

    const [currentTab, setCurrentTab] = useState(MarketsAccountTabType.Markets);
    const { currentProfileSession } = useFireflyProfileStore();

    const markets = event?.markets || EMPTY_LIST;
    const marketIds = markets.map((x) => x.conditionId);
    const enabled = !!currentProfileSession && platform === PredictionPlatform.Polymarket && marketIds.length > 0;
    const { data: positionAccounts } = useQuery({
        queryKey: [
            Source.Prediction,
            'current-orders',
            platform,
            marketIds.join(','),
            currentProfileSession?.profileId,
        ],
        enabled,
        queryFn: enabled
            ? async () => {
                  return getAccountMarketPositions(marketIds);
              }
            : skipToken,
    });
    const { data: openOrders } = useQuery({
        queryKey: [Source.Prediction, 'open-orders', platform, 'all', currentProfileSession?.profileId],
        staleTime: STALE_TIMES.MINUTE_5,
        enabled,
        queryFn: enabled ? () => getPredictionOpenOrders({ platform }) : skipToken,
        select: (data) => {
            const orders = data?.data || EMPTY_LIST;
            return orders.filter((order) => marketIds.includes(order.market));
        },
    });

    const wallets: Array<{
        wallet: string;
        proxy: string;
    }> = useMemo(
        () =>
            positionAccounts?.flatMap((x) =>
                x.wallet && x.proxy
                    ? [
                          {
                              wallet: x.wallet,
                              proxy: x.proxy,
                          },
                      ]
                    : [],
            ) || [],
        [positionAccounts],
    );

    if (!event) return null;

    const firstMarket = markets[0];
    if (
        !marketsContent &&
        !wallets.length &&
        markets.length <= 1 &&
        (firstMarket?.isClosed || firstMarket?.isResolved)
    ) {
        return null;
    }
    const hasAccountData = wallets.length > 0 || !!openOrders?.length;
    const effectiveTab = hasAccountData ? currentTab : MarketsAccountTabType.Markets;

    return (
        <div>
            {hasAccountData ? (
                <MarketsAccountDataTab
                    platform={platform}
                    eventSlug={eventSlug || event.id}
                    currentTab={currentTab}
                    onTabChange={setCurrentTab}
                />
            ) : null}
            <MarketsAccountDataTabContent
                markets={markets}
                platform={platform}
                wallets={wallets}
                eventSlug={eventSlug || event.id}
                eventTitle={event.title}
                eventId={event.id}
                currentTab={effectiveTab}
                marketsContent={marketsContent}
            />
        </div>
    );
});
