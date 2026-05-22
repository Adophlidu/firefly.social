'use client';

import { BetsPriceTimeRange } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { ComponentType } from 'react';
import { memo, useMemo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Loading } from '@/components/Loading.js';
import { STALE_TIMES } from '@/constants/query.js';
import { dynamic } from '@/esm/dynamic.js';
import { toFixedTrimmed } from '@/helpers/polymarket.js';
import { getPriceHistory } from '@/providers/prediction/polymarket/getPriceHistory.js';
import type { PriceHistoryInterval } from '@/providers/prediction/polymarket/type.js';
import type { BetsMarketDataForUI } from '@/types/prediction.js';

async function importRecharts() {
    return import('recharts');
}

type RechartsModule = Awaited<ReturnType<typeof importRecharts>>;

function loadRechartComponent(name: keyof RechartsModule) {
    return async () => {
        const mod = await importRecharts();
        return mod[name] as ComponentType<Record<string, unknown>>;
    };
}

const CartesianGrid = dynamic<Record<string, unknown>>(loadRechartComponent('CartesianGrid'), { ssr: false });
const Line = dynamic<Record<string, unknown>>(loadRechartComponent('Line'), { ssr: false });
const LineChart = dynamic<Record<string, unknown>>(loadRechartComponent('LineChart'), { ssr: false });
const ResponsiveContainer = dynamic<Record<string, unknown>>(loadRechartComponent('ResponsiveContainer'), {
    ssr: false,
});
const Tooltip = dynamic<Record<string, unknown>>(loadRechartComponent('Tooltip'), { ssr: false });
const YAxis = dynamic<Record<string, unknown>>(loadRechartComponent('YAxis'), { ssr: false });

export interface SportChartOutcome {
    id: string;
    label: string;
    price: string;
    color: string;
}

interface SportPriceHistoryChartProps {
    market: BetsMarketDataForUI;
    outcomes: SportChartOutcome[];
    timeRange: BetsPriceTimeRange;
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

function computeTicks(data: Array<Record<string, string | number>>, outcomes: SportChartOutcome[]) {
    const selectedIds = new Set(outcomes.map((outcome) => outcome.id));
    const allPrices: number[] = [];

    for (const item of data) {
        for (const key of Object.keys(item)) {
            if (!selectedIds.has(key)) continue;
            allPrices.push(Number.isNaN(+item[key]) ? 0 : +item[key]);
        }
    }

    if (!allPrices.length) return splitTicks(0, 1, ticksCount);

    const min = Math.max(0, Math.min(...allPrices));
    const max = Math.min(1, Math.max(...allPrices));
    if (min === max) {
        const padding = min === 0 || max === 1 ? 0.1 : 0.05;
        return splitTicks(Math.max(0, min - padding), Math.min(1, max + padding), ticksCount);
    }

    return splitTicks(min, max, ticksCount);
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

function formatPolymarketTimeRange(
    timeRange: BetsPriceTimeRange,
    createTime: number,
): {
    startTs?: number;
    fidelity?: number;
    interval?: PriceHistoryInterval;
} {
    const days = dayjs().diff(createTime, 'day');
    const hours = dayjs().diff(createTime, 'hour');

    let diffMaxRange: BetsPriceTimeRange | null;
    if (days >= 30) {
        diffMaxRange = BetsPriceTimeRange.OneMonth;
    } else if (days >= 7) {
        diffMaxRange = BetsPriceTimeRange.OneWeek;
    } else if (days >= 1) {
        diffMaxRange = BetsPriceTimeRange.OneDay;
    } else if (hours >= 6) {
        diffMaxRange = BetsPriceTimeRange.SixHours;
    } else if (hours >= 1) {
        diffMaxRange = BetsPriceTimeRange.OneHour;
    } else {
        diffMaxRange = null;
    }

    let startTs: number | undefined;
    let fidelity: number | undefined;
    let interval: PriceHistoryInterval | undefined;
    if (!!diffMaxRange && timeRange <= diffMaxRange) {
        switch (timeRange) {
            case BetsPriceTimeRange.OneHour: {
                interval = '1h';
                fidelity = 1;
                break;
            }
            case BetsPriceTimeRange.SixHours: {
                interval = '6h';
                fidelity = 1;
                break;
            }
            case BetsPriceTimeRange.OneDay: {
                interval = '1d';
                fidelity = 5;
                break;
            }
            case BetsPriceTimeRange.OneWeek: {
                interval = '1w';
                fidelity = 30;
                break;
            }
            case BetsPriceTimeRange.OneMonth: {
                interval = '1m';
                fidelity = 180;
                break;
            }
            case BetsPriceTimeRange.All: {
                interval = 'max';
                fidelity = 720;
                break;
            }
            default:
                safeUnreachable(timeRange);
                break;
        }
    } else {
        startTs = dayjs(createTime).unix();

        switch (diffMaxRange) {
            case BetsPriceTimeRange.OneHour:
            case BetsPriceTimeRange.SixHours: {
                fidelity = 1;
                break;
            }
            case BetsPriceTimeRange.OneDay: {
                fidelity = 5;
                break;
            }
            case BetsPriceTimeRange.OneWeek: {
                fidelity = 30;
                break;
            }
            case BetsPriceTimeRange.OneMonth: {
                fidelity = 720;
                break;
            }
            default: {
                fidelity = 1;
                break;
            }
        }
    }

    return { startTs, interval, fidelity };
}

interface SportTooltipContentProps {
    active?: boolean;
    payload?: Array<{
        dataKey?: string | number;
        value?: string | number;
        payload?: {
            time?: number;
        };
    }>;
}

function SportChartTooltip(outcomes: SportChartOutcome[]) {
    return function Content({ active, payload }: SportTooltipContentProps) {
        const isVisible = !!active && !!payload?.length;
        const time = payload?.[0]?.payload?.time
            ? dayjs(payload[0].payload.time * 1000).format('MMM D, YYYY h:mmA')
            : null;

        return (
            <div className={isVisible ? 'visible' : 'invisible'}>
                {isVisible ? (
                    <div>
                        {time ? <span className="text-second text-xs">{time}</span> : null}
                        <div className="space-y-2">
                            {payload.map((data) => {
                                const dataKey = data.dataKey?.toString();
                                const outcome = outcomes.find((item) => item.id === dataKey);
                                if (!outcome || data.value === undefined) return null;

                                return (
                                    <div key={dataKey}>
                                        <div
                                            className="inline-flex h-7 max-w-[80vw] items-center gap-1 rounded px-2 text-sm text-white md:max-w-[400px]"
                                            style={{ backgroundColor: outcome.color }}
                                        >
                                            <span className="min-w-0 flex-1 truncate">{outcome.label}</span>
                                            <span className="shrink-0">
                                                {toFixedTrimmed(+(data.value || 0) * 100, 2)}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : null}
            </div>
        );
    };
}

export const SportPriceHistoryChart = memo(function SportPriceHistoryChart({
    market,
    outcomes,
    timeRange,
    onPayloadChange,
}: SportPriceHistoryChartProps) {
    const { data, isLoading, isRefetching, isRefetchError, error, isPending, refetch } = useQuery({
        queryKey: ['sport', 'market-outcomes-price-history', market.id, timeRange, outcomes.map((o) => o.id).join(',')],
        staleTime: STALE_TIMES.MINUTE_2,
        retry: false,
        enabled: outcomes.length > 0,
        queryFn: async ({ signal }) => {
            const histories = await Promise.all(
                outcomes.map(async (outcome) => {
                    const response = await getPriceHistory({
                        market: outcome.id,
                        signal,
                        ...formatPolymarketTimeRange(timeRange, market.createTime),
                    });
                    return { outcome, history: response.history || [] };
                }),
            );

            const maxLength = Math.max(...histories.map(({ history }) => history.length));
            if (!maxLength) return [];

            return Array.from({ length: maxLength }).flatMap((_, index) => {
                const time = histories.find(({ history }) => !!history[index]?.t)?.history[index]?.t;
                if (!time) return [];

                return [
                    histories.reduce<Record<string, string | number>>(
                        (acc, item) => {
                            const point = item.history[index];
                            return point ? { ...acc, [item.outcome.id]: point.p } : acc;
                        },
                        { time },
                    ),
                ];
            });
        },
    });

    const gridData = useMemo(() => {
        if (!data?.length) return;

        const ticks = computeTicks(data, outcomes);
        const horizontalPoints = computeHorizontalPoints(ticks.length, chartHeight);

        return { ticks, horizontalPoints };
    }, [data, outcomes]);

    if (isLoading || isRefetching || isRefetchError || isPending) return <Loading minHeight={chartHeight} />;
    if (error)
        return (
            <div
                style={{ height: chartHeight }}
                className="text-second flex w-full items-center justify-center text-sm"
            >
                <ClickableButton className="px-3 hover:underline" onClick={() => refetch()}>
                    <Trans>Retry</Trans>
                </ClickableButton>
            </div>
        );
    if (!data?.length || !outcomes.length)
        return (
            <div
                style={{ height: chartHeight }}
                className="text-second flex w-full items-center justify-center text-sm"
            >
                <Trans>There is no data available for display.</Trans>
            </div>
        );

    return (
        <div className="w-full" style={{ height: chartHeight }}>
            <ResponsiveContainer>
                <LineChart
                    data={data}
                    onMouseMove={(e: { activePayload?: Array<{ dataKey: string; value?: number }> }) => {
                        if (!e.activePayload?.length) return;
                        onPayloadChange?.(e.activePayload);
                    }}
                    onMouseLeave={() => {
                        onPayloadChange?.();
                    }}
                >
                    {outcomes.map((outcome) => (
                        <Line
                            key={outcome.id}
                            type="monotone"
                            dataKey={outcome.id}
                            stroke={outcome.color}
                            strokeWidth={2}
                            dot={false}
                            animationDuration={100}
                        />
                    ))}
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
                        tickFormatter={(value: number) => `${toFixedTrimmed(value * 100, 1)}%`}
                        domain={([min, max]: [number, number]) =>
                            gridData?.ticks?.length
                                ? [gridData.ticks[0], gridData.ticks[gridData.ticks.length - 1]]
                                : [min, max]
                        }
                    />
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        className="text-third"
                        stroke="currentColor"
                        horizontalPoints={gridData?.horizontalPoints}
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={SportChartTooltip(outcomes)} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
});
