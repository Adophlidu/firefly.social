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
    if (!event) return null;

    const series = first(event.series || []);
    const recurrence = series?.recurrence ? event.cryptoData?.recurrence || series.recurrence : null;
    const showPriceChart = !!recurrence && !!event.cryptoData?.name && !!series;
    const isSingleMarket = event.markets.length === 1;

    // Crypto recurring events show the asset price chart, matching Polymarket. This includes
    // multi-strike events (e.g. hourly "Bitcoin above ___" with many strikes) — previously
    // gated out by the single-market check below, so they rendered no chart at all. Multi-strike
    // events have no single price-to-beat, so omit the target line there.
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
                priceToBeat={isSingleMarket ? event.cryptoData?.priceToBeat : undefined}
                finalPrice={isSingleMarket ? event.cryptoData?.finalPrice : undefined}
                isMultiStrike={!isSingleMarket}
            />
        );
    }

    // Recurring multi-strike events without a crypto price chart rendered nothing before — keep that,
    // so this change only affects the crypto price-chart path above.
    if (recurrence && !isSingleMarket) return null;

    // Non-crypto (or RatioLine) events only show the probability chart while active or single-market.
    const showSingleChart = event.markets.some((market) => !market.isResolved && !market.isClosed) || isSingleMarket;
    if (!showSingleChart) return null;

    return (
        <PredictionMarketsPriceLineChart
            className="mt-[5px] !py-0"
            platform={event.platform}
            markets={event.markets}
            isActive={isActive}
            showBuyButtons={!showPriceChart}
            filterResolvedMarkets={event.markets.length > 1}
            eventSlug={event.slug}
        />
    );
});
