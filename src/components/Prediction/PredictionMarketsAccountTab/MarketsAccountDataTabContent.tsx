'use client';

import { safeUnreachable } from '@dimensiondev/utils';
import { memo } from 'react';

import { Loading } from '@/components/Loading.js';
import { PredictionMarketList } from '@/components/Prediction/PredictionMarketList.js';
import { type PredictionPlatform } from '@/constants/enum.js';
import { dynamic } from '@/esm/dynamic.js';
import { MarketsAccountTabType } from '@/providers/prediction/polymarket/constants.js';
import { type BetsMarketDataForUI } from '@/types/prediction.js';

const MarketsCurrentPositions = dynamic(
    () =>
        import('@/components/Prediction/PredictionMarketsAccountTab/MarketsCurrentPositions.js').then(
            (m) => m.MarketsCurrentPositions,
        ),
    {
        ssr: false,
        loading: () => <Loading minHeight={274} />,
    },
);
const PredictionOpenOrders = dynamic(
    () =>
        import('@/components/Prediction/PredictionMarketsAccountTab/PredictionOpenOrders.js').then(
            (m) => m.PredictionOpenOrders,
        ),
    {
        ssr: false,
        loading: () => <Loading minHeight={274} />,
    },
);

interface Props {
    markets: BetsMarketDataForUI[];
    platform: PredictionPlatform;
    wallets: Array<{
        wallet: string;
        proxy: string;
    }>;
    eventSlug?: string;
    eventTitle?: string;
    eventId: string;
    currentTab: MarketsAccountTabType;
}

export const MarketsAccountDataTabContent = memo<Props>(function MarketsAccountDataTabContent({
    markets,
    platform,
    wallets,
    eventSlug,
    eventTitle,
    eventId,
    currentTab,
}) {
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
            return (
                <MarketsCurrentPositions markets={markets} platform={platform} wallets={wallets} eventId={eventId} />
            );
        case MarketsAccountTabType.Orders:
            return <PredictionOpenOrders platform={platform} markets={markets} />;
        default:
            safeUnreachable(currentTab);
            return null;
    }
});
