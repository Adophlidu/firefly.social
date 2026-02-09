'use client';

import { safeUnreachable } from '@dimensiondev/utils';
import { memo } from 'react';

import { PredictionMarketList } from '@/components/Prediction/PredictionMarketList.js';
import { MarketsCurrentPositions } from '@/components/Prediction/PredictionMarketsAccountTab/MarketsCurrentPositions.js';
import { PredictionOpenOrders } from '@/components/Prediction/PredictionMarketsAccountTab/PredictionOpenOrders.js';
import type { PredictionPlatform } from '@/constants/enum.js';
import { MarketsAccountTabType, useMarketsAccountTab } from '@/hooks/prediction/useMarketsAccountTab.js';
import type { BetsMarketDataForUI } from '@/types/prediction.js';

interface Props {
    markets: BetsMarketDataForUI[];
    platform: PredictionPlatform;
    wallets: Array<{
        wallet: string;
        proxy: string;
    }>;
    eventSlug?: string;
    eventTitle?: string;
}

export const MarketsAccountDataTabContent = memo<Props>(function MarketsAccountDataTabContent({
    markets,
    platform,
    wallets,
    eventSlug,
    eventTitle,
}) {
    const [currentTab] = useMarketsAccountTab();

    switch (currentTab) {
        case MarketsAccountTabType.Markets:
            return (
                <PredictionMarketList
                    markets={markets}
                    platform={platform}
                    eventSlug={eventSlug}
                    eventTitle={eventTitle}
                />
            );
        case MarketsAccountTabType.Positions:
            return <MarketsCurrentPositions markets={markets} platform={platform} wallets={wallets} />;
        case MarketsAccountTabType.Orders:
            return <PredictionOpenOrders platform={platform} />;
        default:
            safeUnreachable(currentTab);
            return null;
    }
});
