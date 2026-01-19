'use client';

import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo, useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Loading } from '@/components/Loading.js';
import { ChartTooltip } from '@/components/Prediction/PredictionMarketsPriceLineChart/ChartTooltip.js';
import { type BetsPriceTimeRange, type PredictionPlatform } from '@/constants/enum.js';
import { toFixedTrimmed } from '@/helpers/polymarket.js';
import { getBetsMarketPriceHistory } from '@/providers/prediction/getBetsMarketPriceHistory.js';
import type { BetsMarketWithSettings } from '@/types/prediction.js';

interface PriceHistoryChartProps {
    markets: BetsMarketWithSettings[];
    timeRange: BetsPriceTimeRange;
    platform: PredictionPlatform;
    outcomeId: string;
    onPayloadChange?: (payload?: Array<{ dataKey: string; value?: number }>) => void;
}

const ticksCount = 7;
const chartHeight = 166;

function splitTicks(min: number, max: number, count: number) {
    const step = (max - min) / (count - 1);
    const ticks = [];
    for (let i = 0; i < count; i += 1) {
        ticks.push(min + step * i);
    }

    return ticks;
}
function computeTicks(data: Array<Record<string, string | number>>, markets: BetsMarketWithSettings[]) {
    const selectedIds = markets.map((m) => m.questionId);
    const allPrices = data.flatMap((item) => {
        return Object.keys(item)
            .filter((key) => selectedIds.includes(key))
            .map((key) => (Number.isNaN(+item[key]) ? 0 : +item[key]));
    });
    return splitTicks(Math.min(...allPrices), Math.max(...allPrices), ticksCount);
}
function computeHorizontalPoints(tickCount: number, chartHeight: number) {
    const step = chartHeight / (tickCount - 1);
    const points: number[] = [];
    const middleIndex = Math.floor(tickCount / 2);

    for (let i = 0; i < tickCount; i += 1) {
        const point = chartHeight - step * i;

        if (i === middleIndex) {
            points.push(point);
        } else if (i < middleIndex) {
            points.push(point - (i === 0 ? 8 : 2));
        } else {
            points.push(point + (i === tickCount - 1 ? 8 : 2));
        }
    }

    return points;
}

export const PriceHistoryChart = memo<PriceHistoryChartProps>(function PriceHistoryChart({
    markets,
    timeRange,
    platform,
    outcomeId,
    onPayloadChange,
}) {
    const selectedMarkets = useMemo(() => markets.filter((m) => m.selected), [markets]);
    const { data, isLoading, isRefetching, isRefetchError, error, isPending, refetch } = useQuery({
        queryKey: [
            'bets',
            'markets-price-history',
            platform,
            timeRange,
            selectedMarkets.map((m) => m.id).join(','),
            outcomeId,
        ],
        staleTime: 1000 * 60 * 2, // 2 minutes
        retry: false,
        queryFn: async ({ signal }) => {
            return getBetsMarketPriceHistory(platform, {
                markets: selectedMarkets,
                timeRange,
                outcomeId,
                signal,
            });
        },
    });
    const gridData = useMemo(() => {
        if (!data?.length) return;

        const ticks = computeTicks(data, selectedMarkets);
        const horizontalPoints = computeHorizontalPoints(ticks.length, chartHeight);

        return { ticks, horizontalPoints };
    }, [data, selectedMarkets]);

    if (isLoading || isRefetching || isRefetchError || isPending) return <Loading minHeight={chartHeight} />;
    if (error)
        return (
            <div
                style={{ height: chartHeight }}
                className="flex w-full items-center justify-center text-sm text-second"
            >
                <ClickableButton className="px-3 hover:underline" onClick={() => refetch()}>
                    <Trans>Retry</Trans>
                </ClickableButton>
            </div>
        );
    if (!data?.length || !selectedMarkets.length)
        return (
            <div
                style={{ height: chartHeight }}
                className="flex w-full items-center justify-center text-sm text-second"
            >
                <Trans>There is no data available for display.</Trans>
            </div>
        );

    return (
        <div className="w-full" style={{ height: chartHeight }}>
            <ResponsiveContainer>
                <LineChart
                    data={data}
                    onMouseMove={(e) => {
                        if (!e.activePayload?.length) return;
                        onPayloadChange?.(e.activePayload);
                    }}
                    onMouseLeave={() => {
                        onPayloadChange?.();
                    }}
                >
                    {selectedMarkets.map((market) => {
                        const lineColor =
                            markets.length === 1
                                ? market.outcomes.find((o) => o.id === outcomeId)?.color
                                : market.color;

                        return (
                            <Line
                                key={market.id}
                                type="monotone"
                                dataKey={market.questionId}
                                stroke={lineColor}
                                strokeWidth={2}
                                dot={false}
                                animationDuration={100}
                            />
                        );
                    })}
                    <YAxis
                        width={40}
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        orientation="right"
                        interval="preserveStartEnd"
                        tick={{
                            className: 'text-second',
                            fontSize: 11,
                        }}
                        ticks={gridData?.ticks}
                        tickFormatter={(value) => `${toFixedTrimmed(value * 100, 1)}%`}
                        domain={([min, max]) => [min, max]}
                    />
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        className="text-third"
                        stroke="currentColor"
                        horizontalPoints={gridData?.horizontalPoints}
                    />
                    <Tooltip<string, string>
                        cursor={{ strokeDasharray: '3 3' }}
                        content={ChartTooltip(markets, outcomeId)}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
});
