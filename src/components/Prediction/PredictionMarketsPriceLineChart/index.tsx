'use client';

import { first, isUndefined, sumBy } from 'lodash-es';
import { useMemo, useState } from 'react';

import ToggleIcon from '@/assets/toggle.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Loading } from '@/components/Loading.js';
import { PredictionMarketBuyButtons } from '@/components/Prediction/PredictionMarketBuyButtons.js';
import { ChartLabels } from '@/components/Prediction/PredictionMarketsPriceLineChart/ChartLabels.js';
import { MarketSettings } from '@/components/Prediction/PredictionMarketsPriceLineChart/MarketSettings.js';
import { TimeRangeSettings } from '@/components/Prediction/PredictionMarketsPriceLineChart/TimeRangeSettings.js';
import { MAX_MARKETS_COUNT_SELECTABLE, PLATFORMS_SUPPORTING_ORDER_BOOK } from '@/constants/bets.js';
import { BetsPriceTimeRange, type PredictionPlatform } from '@/constants/enum.js';
import { dynamic } from '@/esm/dynamic.js';
import { toFixedTrimmed } from '@/helpers/polymarket.js';
import type { BetsMarketDataForUI, BetsMarketWithSettings } from '@/types/prediction.js';

const PriceHistoryChart = dynamic(
    () =>
        import('@/components/Prediction/PredictionMarketsPriceLineChart/PriceHistoryChart.js').then(
            (m) => m.PriceHistoryChart,
        ),
    {
        ssr: false,
        loading: () => <Loading minHeight={166} />,
    },
);

interface PredictionMarketsPriceLineChartProps {
    platform: PredictionPlatform;
    markets: BetsMarketDataForUI[];
    isActive: boolean;
}

const lineColors = ['#FF209B', '#5E69FF', '#FF372B', '#FFAA16', '#00D2FF', '#00FF85', '#FF6EC4', '#8C56FF'];
const outcomeColors = ['#5E69FF', '#FF372B', '#FFAA16', '#00D2FF', '#00FF85', '#FF6EC4', '#8C56FF', '#FF209B'];

function getMarketWinRatio(market: BetsMarketDataForUI) {
    const totalPrice = sumBy(market.outcomes, (outcome) => (Number.isNaN(+outcome.price) ? 0 : +outcome.price));
    return totalPrice > 0 ? (Number(first(market.outcomes)?.price || 0) / totalPrice) * 100 : 0;
}

function toMarketsWithSettings(markets: BetsMarketDataForUI[]): BetsMarketWithSettings[] {
    const sortedMarkets = [...markets]
        .sort((a, b) => getMarketWinRatio(b) - getMarketWinRatio(a))
        .slice(0, MAX_MARKETS_COUNT_SELECTABLE);

    return markets.map((market, index) => ({
        ...market,
        color: lineColors[index % lineColors.length],
        selected: sortedMarkets.some((m) => m.id === market.id),
        totalPrice: sumBy(market.outcomes, (outcome) => (Number.isNaN(+outcome.price) ? 0 : +outcome.price)),
        outcomes: market.outcomes.map((outcome, i) => ({
            ...outcome,
            color: outcomeColors[i % outcomeColors.length],
        })),
    }));
}

export function PredictionMarketsPriceLineChart({ platform, markets, isActive }: PredictionMarketsPriceLineChartProps) {
    const [outcomeId, setOutcomeId] = useState(first(markets)?.outcomes?.[0]?.id || '');
    const [timeRange, setTimeRange] = useState(BetsPriceTimeRange.All);
    const [payload, setPayload] = useState<Array<{ dataKey: string; value?: number }>>();
    const [marketsWithSettings, setMarketsWithSettings] = useState<BetsMarketWithSettings[]>(
        toMarketsWithSettings(markets),
    );

    const labels = useMemo(() => {
        if (markets.length > 1) {
            return marketsWithSettings
                .filter((m) => m.selected)
                .map((market) => {
                    const yesPercent = payload?.length
                        ? payload.find((p) => p.dataKey === market.questionId)?.value
                        : market.totalPrice > 0
                          ? Number(first(market.outcomes)?.price || 0) / market.totalPrice
                          : 0;

                    return {
                        id: market.id,
                        label: market.title,
                        color: market.color,
                        value:
                            isUndefined(yesPercent) || !isActive
                                ? undefined
                                : `${toFixedTrimmed(yesPercent * 100, 2)}%`,
                    };
                });
        }

        const firstMarket = first(marketsWithSettings);
        const outcomeIndex = firstMarket?.outcomes.findIndex((o) => o.id === outcomeId);
        const outcome =
            outcomeIndex !== undefined && outcomeIndex !== -1 ? firstMarket?.outcomes?.[outcomeIndex] : undefined;
        if (!outcome || !firstMarket) return [];

        const yesPercent = payload?.length
            ? payload.find((p) => p.dataKey === firstMarket.questionId)?.value
            : firstMarket.totalPrice > 0
              ? Number(outcome.price || 0) / firstMarket.totalPrice
              : 0;

        return [
            {
                id: outcome.id,
                label: outcome.label,
                value: isUndefined(yesPercent) || !isActive ? undefined : `${toFixedTrimmed(yesPercent * 100, 2)}%`,
                color: outcome.color,
                isResolved: firstMarket?.resolvedOutcomeId === outcome.id,
            },
        ];
    }, [markets, marketsWithSettings, payload, outcomeId, isActive]);

    const supportOrderBook = PLATFORMS_SUPPORTING_ORDER_BOOK.includes(platform);
    const firstMarket = markets[0];

    return (
        <div className="p-4">
            <ChartLabels labels={labels} isSingleMarket={markets.length === 1} />
            <PriceHistoryChart
                outcomeId={outcomeId}
                platform={platform}
                markets={marketsWithSettings}
                timeRange={timeRange}
                onPayloadChange={setPayload}
            />
            <div className="mt-4 flex items-start gap-3">
                <TimeRangeSettings platform={platform} timeRange={timeRange} onTimeRangeChange={setTimeRange} />
                {markets.length > 1 ? (
                    <MarketSettings markets={marketsWithSettings} onMarketsChange={setMarketsWithSettings} />
                ) : (
                    <ClickableButton
                        className="-mt-1 flex size-6 items-center justify-center rounded hover:bg-bg"
                        onClick={() => {
                            const firstMarket = first(markets);
                            if (!firstMarket) return;

                            const outcomeIndex = firstMarket.outcomes.findIndex((o) => o.id === outcomeId);
                            if (outcomeIndex === -1) return;

                            const nextOutcome = firstMarket.outcomes[(outcomeIndex + 1) % firstMarket.outcomes.length];
                            setOutcomeId(nextOutcome.id);
                        }}
                    >
                        <ToggleIcon width={16} height={16} />
                    </ClickableButton>
                )}
            </div>
            {markets.length === 1 && supportOrderBook && !firstMarket.isResolved && !firstMarket.isClosed ? (
                <PredictionMarketBuyButtons
                    className="mt-6"
                    platform={platform}
                    market={firstMarket}
                    size="large"
                    showPrice
                    autoRefreshPrice
                />
            ) : null}
        </div>
    );
}
