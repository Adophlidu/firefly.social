'use client';

import { safeUnreachable } from '@dimensiondev/utils';
import { use, useMemo } from 'react';

import { Loading } from '@/components/Loading.js';
import { PredictionContext } from '@/components/Prediction/PredictionContext.js';
import { PredictionMarketResolution } from '@/components/Prediction/PredictionMarketResolution.js';
import { PredictionPlatform } from '@/constants/enum.js';
import { dynamic } from '@/esm/dynamic.js';
import { BetsEventInfoTab, useBetsEventInfoTab } from '@/hooks/prediction/useBetsEventInfoTab.js';

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
    showResolution?: boolean;
    eventSlug?: string;
    eventTitle?: string;
}

export function PredictionBaseInfoTabContent({
    platform,
    showResolution,
    eventSlug,
    eventTitle,
}: PredictionBaseInfoTabContentProps) {
    const { event: detail } = use(PredictionContext);
    const [tab] = useBetsEventInfoTab(showResolution);

    const marketIds = useMemo(
        () => detail?.markets.map((x) => (platform === PredictionPlatform.Opinion ? x.questionId : x.conditionId)),
        [detail?.markets, platform],
    );

    if (!detail || !marketIds) return null;

    switch (tab) {
        case BetsEventInfoTab.TopHolders:
            return (
                <PredictionMarketTopHolders
                    platform={platform}
                    markets={detail.markets}
                    eventSlug={eventSlug}
                    eventTitle={eventTitle}
                />
            );
        case BetsEventInfoTab.Trades:
            return <PredictionTradeTimeline platform={platform} marketIds={marketIds} eventSlug={eventSlug} />;
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
