'use client';

import type { BetsPriceTimeRange } from '@dimensiondev/enums';
import { PredictionPlatform } from '@dimensiondev/enums';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { scaleLinear, scaleTime } from 'd3-scale';
import { curveMonotoneX, line } from 'd3-shape';
import dayjs from 'dayjs';
import type { CSSProperties } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Loading } from '@/components/Loading.js';
import { STALE_TIMES } from '@/constants/query.js';
import { toFixedTrimmed } from '@/helpers/polymarket.js';
import { getBetsMarketPriceHistory } from '@/providers/prediction/getBetsMarketPriceHistory.js';
import type { BetsMarketDataForUI, SportTeam } from '@/types/prediction.js';

interface SportPriceLineChartProps {
    market: BetsMarketDataForUI;
    homeTeam: SportTeam;
    awayTeam: SportTeam;
    timeRange: BetsPriceTimeRange;
}

interface DataPoint {
    time: number;
    home: number;
    away: number;
}

interface TooltipState {
    dataIndex: number;
}

const chartHeight = 200;
const plotTop = 10;
const plotHeight = 160;
const yAxisOffset = 47;
const oddsLabelGap = 100;
const oddsLabelOffset = 14;
const gridTrailing = 4;
const labelHeight = 43;
const labelMinGap = 11;
const fixedTicks = [1, 0.75, 0.5, 0.25, 0];
const mutedLineColor = 'var(--color-third, #8b98a5)';
const chartBgStyle = { '--chart-bg': 'var(--color-bg, #fff)' } as CSSProperties;

function formatXAxisTime(timestamp: number) {
    return dayjs(timestamp).format('h:mm A');
}

function clampPrice(value: number) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
}

function resolveLabelPositions(homeValue: number, awayValue: number) {
    const minDistance = labelHeight + labelMinGap;
    let homeTop = plotHeight * (1 - homeValue);
    let awayTop = plotHeight * (1 - awayValue);

    if (Math.abs(homeTop - awayTop) < minDistance) {
        const mid = (homeTop + awayTop) / 2;
        const upperTop = mid - minDistance / 2;
        const lowerTop = mid + minDistance / 2;

        if (homeTop <= awayTop) {
            homeTop = upperTop;
            awayTop = lowerTop;
        } else {
            homeTop = lowerTop;
            awayTop = upperTop;
        }
    }

    return {
        homeTop: plotTop + Math.max(0, Math.min(homeTop, plotHeight - labelHeight)),
        awayTop: plotTop + Math.max(0, Math.min(awayTop, plotHeight - labelHeight)),
    };
}

function EndDots({
    homeColor,
    awayColor,
    homeY,
    awayY,
    rightEdge,
}: {
    homeColor: string;
    awayColor: string;
    homeY: number;
    awayY: number;
    rightEdge: number;
}) {
    return (
        <g className="pointer-events-none">
            <circle cx={rightEdge} cy={homeY} r={4} fill={homeColor} opacity={1} />
            <circle cx={rightEdge} cy={homeY} r={4} fill={homeColor}>
                <animate attributeName="r" values="4;16;4" dur="2.25s" begin="0.7s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0;0.6" dur="2.25s" begin="0.7s" repeatCount="indefinite" />
            </circle>
            <circle cx={rightEdge} cy={awayY} r={4} fill={awayColor} opacity={1} />
            <circle cx={rightEdge} cy={awayY} r={4} fill={awayColor}>
                <animate attributeName="r" values="4;16;4" dur="2.25s" begin="0.7s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0;0.6" dur="2.25s" begin="0.7s" repeatCount="indefinite" />
            </circle>
        </g>
    );
}

function SideOddsLabel({
    name,
    pct,
    color,
    top,
    left,
}: {
    name: string;
    pct: string;
    color: string;
    top: number;
    left: number;
}) {
    return (
        <div className="pointer-events-none absolute z-10" style={{ left, top }}>
            <div className="flex flex-col items-start gap-[3.3px]">
                <span
                    className="whitespace-nowrap text-[13px] font-medium leading-[14px]"
                    style={{
                        color,
                        WebkitTextStroke: '3px var(--chart-bg, var(--color-bg, #fff))',
                        paintOrder: 'stroke',
                    }}
                >
                    {name}
                </span>
                <span
                    className="whitespace-nowrap text-[26px] font-semibold leading-none"
                    style={{
                        color,
                        WebkitTextStroke: '3px var(--chart-bg, var(--color-bg, #fff))',
                        paintOrder: 'stroke',
                    }}
                >
                    {pct}
                </span>
            </div>
        </div>
    );
}

function HoverTimeLabel({ dataPoint, left }: { dataPoint: DataPoint; left: number }) {
    const time = dayjs(dataPoint.time * 1000).format('MMM D, h:mm A');

    return (
        <div
            className="pointer-events-none absolute z-10 whitespace-nowrap text-[13px] font-medium leading-[18px]"
            style={{
                left,
                top: 0,
                color: 'var(--color-third, #b1b1b1)',
                transform: 'translateX(-50%)',
                WebkitTextStroke: '3px var(--chart-bg, var(--color-bg, #fff))',
                paintOrder: 'stroke',
            }}
        >
            {time}
        </div>
    );
}

function ChartLinePath({
    d,
    color,
    opacity = 1,
    outline = true,
}: {
    d: string | null;
    color: string;
    opacity?: number;
    outline?: boolean;
}) {
    if (!d) return null;

    return (
        <>
            {outline ? (
                <path
                    d={d}
                    fill="transparent"
                    stroke="var(--chart-bg, #fff)"
                    strokeWidth={2}
                    className="pointer-events-none"
                    pathLength={1}
                />
            ) : null}
            <path
                d={d}
                fill="transparent"
                stroke={color}
                strokeWidth={1.75}
                strokeOpacity={opacity}
                className="pointer-events-none"
                pathLength={1}
                shapeRendering="geometricPrecision"
            />
        </>
    );
}

export const SportPriceLineChart = memo(function SportPriceLineChart({
    market,
    homeTeam,
    awayTeam,
    timeRange,
}: SportPriceLineChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const resizeRef = useRef<ResizeObserver | null>(null);
    const [width, setWidth] = useState(0);
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);

    const homeColor = homeTeam.color || '#BB761B';
    const awayColor = awayTeam.color || '#87BFFF';
    const homeOutcome = market.outcomes[0];
    const awayOutcome = market.outcomes[1];

    const handleResize = useCallback(() => {
        if (!containerRef.current) return;
        setWidth(containerRef.current.offsetWidth);
    }, []);

    const containerCallbackRef = useCallback(
        (node: HTMLDivElement | null) => {
            resizeRef.current?.disconnect();
            resizeRef.current = null;
            containerRef.current = node;

            if (!node) return;

            setWidth(node.offsetWidth);
            const observer = new ResizeObserver(handleResize);
            observer.observe(node);
            resizeRef.current = observer;
        },
        [handleResize],
    );

    useEffect(() => () => resizeRef.current?.disconnect(), []);

    const { data, isLoading, error } = useQuery({
        queryKey: ['sport', 'price-history', market.id, homeOutcome?.id, awayOutcome?.id, timeRange],
        staleTime: STALE_TIMES.MINUTE_2,
        retry: false,
        queryFn: async ({ signal }) => {
            const rawData = await getBetsMarketPriceHistory(PredictionPlatform.Polymarket, {
                markets: [market],
                timeRange,
                outcomeId: homeOutcome?.id || '',
                isSingleMarket: true,
                signal,
            });

            if (!rawData?.length) return [];

            return rawData.map((item) => {
                const home = clampPrice(Number(item[market.id]));
                return {
                    time: item.time as number,
                    home,
                    away: clampPrice(1 - home),
                };
            });
        },
    });

    const latestHome = useMemo(() => {
        if (!data?.length) return clampPrice(Number.parseFloat(homeOutcome?.price || '0.5'));
        return data[data.length - 1].home;
    }, [data, homeOutcome?.price]);

    const latestAway = useMemo(() => {
        if (!data?.length) return clampPrice(Number.parseFloat(awayOutcome?.price || '0.5'));
        return data[data.length - 1].away;
    }, [awayOutcome?.price, data]);
    const activeDataIndex = data?.length ? Math.min(tooltip?.dataIndex ?? data.length - 1, data.length - 1) : -1;
    const activeDataPoint = activeDataIndex >= 0 && data?.length ? data[activeDataIndex] : null;
    const activeHome = activeDataPoint?.home ?? latestHome;
    const activeAway = activeDataPoint?.away ?? latestAway;
    const homePct = `${toFixedTrimmed(activeHome * 100, 1)}%`;
    const awayPct = `${toFixedTrimmed(activeAway * 100, 1)}%`;
    const labelPositions = useMemo(() => resolveLabelPositions(activeHome, activeAway), [activeHome, activeAway]);

    const dimensions = useMemo(() => {
        const axisX = Math.max(0, width - yAxisOffset);
        const dataWidth = Math.max(0, axisX - oddsLabelGap);
        const gridWidth = Math.max(0, axisX + gridTrailing);
        return {
            axisX,
            dataWidth,
            gridWidth,
        };
    }, [width]);

    const { xScale, yScale, xTicks, homePath, homeMutedPath, awayPath, awayMutedPath } = useMemo(() => {
        const y = scaleLinear().range([plotHeight, 0]).domain([0, 1]);

        if (!data?.length || dimensions.dataWidth <= 0) {
            return {
                xScale: scaleTime()
                    .range([0, 1])
                    .domain([new Date(0), new Date(1)]),
                yScale: y,
                xTicks: [] as Date[],
                homePath: null as string | null,
                homeMutedPath: null as string | null,
                awayPath: null as string | null,
                awayMutedPath: null as string | null,
            };
        }

        const firstTs = new Date(data[0].time * 1000);
        const lastTs = new Date(data[data.length - 1].time * 1000);
        const x = scaleTime().range([0, dimensions.dataWidth]).domain([firstTs, lastTs]);

        const lineGenerator = line<DataPoint>()
            .x((d) => x(new Date(d.time * 1000)))
            .curve(curveMonotoneX);
        const createPath = (points: DataPoint[], key: 'home' | 'away') => {
            if (points.length < 2) return null;
            return lineGenerator.y((d) => y(d[key]))(points) ?? null;
        };
        const selectedIndex = Math.max(0, activeDataIndex);
        const coloredData = data.slice(0, selectedIndex + 1);
        const mutedData = selectedIndex < data.length - 1 ? data.slice(selectedIndex) : [];

        return {
            xScale: x,
            yScale: y,
            xTicks: x.ticks(5),
            homePath: createPath(coloredData, 'home'),
            homeMutedPath: createPath(mutedData, 'home'),
            awayPath: createPath(coloredData, 'away'),
            awayMutedPath: createPath(mutedData, 'away'),
        };
    }, [activeDataIndex, data, dimensions.dataWidth]);

    const handleMouseMove = useCallback(
        (event: React.MouseEvent<SVGRectElement>) => {
            if (!data?.length || dimensions.dataWidth <= 0) return;

            const rect = event.currentTarget.getBoundingClientRect();
            const mouseX = Math.max(0, Math.min(event.clientX - rect.left, dimensions.dataWidth));
            const targetTime = xScale.invert(mouseX).getTime();
            let closestIdx = 0;
            let closestDist = Infinity;

            for (let i = 0; i < data.length; i += 1) {
                const dist = Math.abs(data[i].time * 1000 - targetTime);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestIdx = i;
                }
            }

            setTooltip((current) => (current?.dataIndex === closestIdx ? current : { dataIndex: closestIdx }));
        },
        [data, dimensions.dataWidth, xScale],
    );

    const activeX =
        activeDataPoint && dimensions.dataWidth > 0
            ? Math.max(0, Math.min(xScale(new Date(activeDataPoint.time * 1000)), dimensions.dataWidth))
            : dimensions.dataWidth;

    if (isLoading)
        return (
            <div className="pb-2 pt-6">
                <Loading minHeight={chartHeight} />
            </div>
        );
    if (error || !data?.length) {
        return (
            <div
                style={{ height: chartHeight, color: 'var(--color-second, #767676)' }}
                className="box-content flex w-full items-center justify-center pb-2 pt-6 text-sm"
            >
                <Trans>No chart data available</Trans>
            </div>
        );
    }

    const homeName = homeTeam.abbreviation || homeTeam.name || t`Home`;
    const awayName = awayTeam.abbreviation || awayTeam.name || t`Away`;
    const homeDotY = yScale(activeHome);
    const awayDotY = yScale(activeAway);

    return (
        <div className="w-full overflow-visible px-1 pb-2 pt-6" style={chartBgStyle}>
            <div className="relative" style={{ height: chartHeight }} ref={containerCallbackRef}>
                {width > 0 ? (
                    <svg width={width} height={chartHeight} className="overflow-visible">
                        <g transform={`translate(0, ${plotTop})`} overflow="visible">
                            {fixedTicks.map((tick) => (
                                <line
                                    key={tick}
                                    x1={0}
                                    y1={yScale(tick)}
                                    x2={dimensions.gridWidth}
                                    y2={yScale(tick)}
                                    fill="transparent"
                                    stroke="var(--color-line2, #e7e7e7)"
                                    strokeDasharray="1,3"
                                    strokeOpacity={0.5}
                                    shapeRendering="crispEdges"
                                />
                            ))}

                            <g transform={`translate(${dimensions.axisX}, 0)`}>
                                {fixedTicks.map((tick) => (
                                    <g key={tick}>
                                        <line
                                            x1={0}
                                            y1={yScale(tick)}
                                            x2={8}
                                            y2={yScale(tick)}
                                            fill="transparent"
                                            stroke="transparent"
                                            strokeWidth={1}
                                            shapeRendering="crispEdges"
                                        />
                                        <text
                                            x={8}
                                            y={yScale(tick)}
                                            dy="0.32em"
                                            fill="var(--color-third, #b1b1b1)"
                                            fontFamily="Arial"
                                            fontSize={12}
                                            textAnchor="start"
                                        >
                                            {Math.round(tick * 100)}%
                                        </text>
                                    </g>
                                ))}
                            </g>

                            <g>
                                <ChartLinePath d={homePath} color={homeColor} />
                                <ChartLinePath d={awayPath} color={awayColor} />
                                <ChartLinePath
                                    d={homeMutedPath}
                                    color={mutedLineColor}
                                    opacity={0.28}
                                    outline={false}
                                />
                                <ChartLinePath
                                    d={awayMutedPath}
                                    color={mutedLineColor}
                                    opacity={0.28}
                                    outline={false}
                                />
                            </g>

                            <EndDots
                                homeColor={homeColor}
                                awayColor={awayColor}
                                homeY={homeDotY}
                                awayY={awayDotY}
                                rightEdge={activeX}
                            />

                            <g transform={`translate(0, ${plotHeight})`}>
                                {xTicks.map((tick) => (
                                    <text
                                        key={tick.getTime()}
                                        x={xScale(tick)}
                                        y={12}
                                        fill="var(--color-third, #b1b1b1)"
                                        fontFamily="Arial"
                                        fontSize={12}
                                        textAnchor="middle"
                                    >
                                        {formatXAxisTime(tick.getTime())}
                                    </text>
                                ))}
                            </g>

                            <rect
                                width={dimensions.dataWidth}
                                height={plotHeight}
                                fill="transparent"
                                onMouseMove={handleMouseMove}
                                onMouseLeave={() => setTooltip(null)}
                                style={{ cursor: 'crosshair' }}
                            />

                            {tooltip && activeDataPoint ? (
                                <line
                                    x1={activeX}
                                    y1={0}
                                    x2={activeX}
                                    y2={plotHeight}
                                    stroke="var(--color-line2, #e7e7e7)"
                                    strokeDasharray="1,3"
                                    strokeOpacity={0.5}
                                    shapeRendering="crispEdges"
                                />
                            ) : null}
                        </g>
                    </svg>
                ) : null}

                {tooltip && activeDataPoint ? <HoverTimeLabel dataPoint={activeDataPoint} left={activeX} /> : null}

                <SideOddsLabel
                    name={homeName}
                    pct={homePct}
                    color={homeColor}
                    top={labelPositions.homeTop}
                    left={activeX + oddsLabelOffset}
                />
                <SideOddsLabel
                    name={awayName}
                    pct={awayPct}
                    color={awayColor}
                    top={labelPositions.awayTop}
                    left={activeX + oddsLabelOffset}
                />
            </div>
        </div>
    );
});
