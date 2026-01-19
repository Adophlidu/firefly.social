'use client';

import { safeUnreachable } from '@dimensiondev/utils';
import { useMemo } from 'react';

import { Loading } from '@/components/Loading.js';
import { PredictionMarketResolution } from '@/components/Prediction/PredictionMarketResolution.js';
import { PredictionPlatform } from '@/constants/enum.js';
import { dynamic } from '@/esm/dynamic.js';
import { BetsEventInfoTab, useBetsEventInfoTab } from '@/hooks/prediction/useBetsEventInfoTab.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

const PredictionMarketTopHolders = dynamic(
    () =>
        import('@/components/Prediction/PredictionMarketTopHolders/index.js').then((m) => m.PredictionMarketTopHolders),
    { ssr: false, loading: () => <Loading /> },
);
const PredictionTradeTimeline = dynamic(
    () => import('@/components/Prediction/PredictionTradeTimeline.js').then((m) => m.PredictionTradeTimeline),
    { ssr: false, loading: () => <Loading /> },
);
const PredictionEventInfo = dynamic(
    () => import('@/components/Prediction/PredictionEventInfo.js').then((m) => m.PredictionEventInfo),
    {
        ssr: false,
        loading: () => <Loading />,
    },
);

interface PredictionBaseInfoTabContentProps {
    platform: PredictionPlatform;
    detail: BetsEventDataForUI;
    showResolution?: boolean;
}

export function PredictionBaseInfoTabContent({ platform, detail, showResolution }: PredictionBaseInfoTabContentProps) {
    const [tab] = useBetsEventInfoTab(showResolution);

    const marketIds = useMemo(
        () => detail.markets.map((x) => (platform === PredictionPlatform.Opinion ? x.questionId : x.conditionId)),
        [detail.markets, platform],
    );

    switch (tab) {
        case BetsEventInfoTab.TopHolders:
            return <PredictionMarketTopHolders platform={platform} markets={detail.markets} />;
        case BetsEventInfoTab.Trades:
            return <PredictionTradeTimeline platform={platform} marketIds={marketIds} />;
        case BetsEventInfoTab.Info:
            return (
                <PredictionEventInfo
                    eventId={detail.id}
                    platform={platform}
                    tags={detail.tags}
                    volume={detail.volume}
                    endDate={detail.endTime}
                    description={detail.description}
                />
            );
        case BetsEventInfoTab.Resolution:
            return <PredictionMarketResolution market={detail.markets[0]} />;
        default:
            safeUnreachable(tab);
            return null;
    }
}
