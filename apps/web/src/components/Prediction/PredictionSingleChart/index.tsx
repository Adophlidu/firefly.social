'use client';

import { first } from 'lodash-es';
import { memo, use } from 'react';

import { Loading } from '@/components/Loading.js';
import { PredictionContext } from '@/components/Prediction/PredictionContext.js';
import { PredictionMarketsPriceLineChart } from '@/components/Prediction/PredictionMarketsPriceLineChart/index.js';
import { PredictionChartType } from '@/constants/bets.js';
import { dynamic } from '@/esm/dynamic.js';

const AssetPriceChart = dynamic(
    () => import('@/components/Prediction/AssetPriceChart/index.js').then((m) => m.AssetPriceChart),
    {
        ssr: false,
        loading: () => <Loading minHeight={255} />,
    },
);

export const PredictionSingleChart = memo(function PredictionSingleChart() {
    const { event, chartType, isActive } = use(PredictionContext);

    const showSingleChart =
        event?.markets.some((market) => !market.isResolved && !market.isClosed) || event?.markets.length === 1;
    if (!event || !showSingleChart) return null;

    const series = first(event.series || []);
    const recurrence = series?.recurrence ? event.cryptoData?.recurrence || series.recurrence : null;
    if (recurrence && event.markets.length !== 1) return null;

    const showPriceChart = !!recurrence && !!event.cryptoData?.name && !!series;

    if (showPriceChart && chartType === PredictionChartType.PriceLine) {
        return (
            <AssetPriceChart
                isActive={isActive}
                crypto={event.cryptoData!.name}
                recurrence={recurrence}
                startTime={event.startTime}
                endDate={event.endDate}
                platform={event.platform}
                seriesId={series.id}
                priceToBeat={event.cryptoData?.priceToBeat}
                finalPrice={event.cryptoData?.finalPrice}
            />
        );
    }

    return (
        <PredictionMarketsPriceLineChart
            className="mt-[5px] !py-0"
            platform={event.platform}
            markets={event.markets}
            isActive={isActive}
            showBuyButtons={!showPriceChart}
            filterResolvedMarkets={event.markets.length > 1}
        />
    );
});
