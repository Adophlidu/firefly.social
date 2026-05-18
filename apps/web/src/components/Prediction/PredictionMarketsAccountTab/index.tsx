'use client';

import { Source } from '@dimensiondev/enums';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { skipToken, useQuery } from '@tanstack/react-query';
import { compact, first } from 'lodash-es';
import { memo, use, useMemo, useState } from 'react';

import { PredictionContext } from '@/components/Prediction/PredictionContext.js';
import { MarketsAccountDataTab } from '@/components/Prediction/PredictionMarketsAccountTab/MarketsAccountDataTab.js';
import { MarketsAccountDataTabContent } from '@/components/Prediction/PredictionMarketsAccountTab/MarketsAccountDataTabContent.js';
import { PredictionPlatform } from '@/constants/enum.js';
import { getAccountMarketPositions } from '@/providers/firefly/prediction/getAccountMarketPositions.js';
import { MarketsAccountTabType } from '@/providers/prediction/polymarket/constants.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

interface PredictionMarketsAccountTabProps {
    platform: PredictionPlatform;
    eventSlug?: string;
}

export const PredictionMarketsAccountTab = memo<PredictionMarketsAccountTabProps>(function PredictionMarketsAccountTab({
    eventSlug,
    platform,
}) {
    const { event } = use(PredictionContext);

    const [currentTab, setCurrentTab] = useState(MarketsAccountTabType.Markets);
    const { currentProfileSession } = useFireflyProfileStore();

    const markets = event?.markets || EMPTY_LIST;
    const marketIds = markets.map((x) => x.conditionId);
    const enabled = !!currentProfileSession && platform === PredictionPlatform.Polymarket && marketIds.length > 0;
    const { data } = useQuery({
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

    const wallets: Array<{
        wallet: string;
        proxy: string;
    }> = useMemo(
        () =>
            compact(
                data?.map((x) =>
                    x.wallet && x.proxy
                        ? {
                              wallet: x.wallet,
                              proxy: x.proxy,
                          }
                        : null,
                ),
            ),
        [data],
    );

    if (!event) return null;

    const firstMarket = first(markets);
    if (!wallets.length && markets.length <= 1 && (firstMarket?.isClosed || firstMarket?.isResolved)) return null;

    return (
        <div>
            {wallets?.length > 0 ? (
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
                currentTab={currentTab}
            />
        </div>
    );
});
