'use client';

import { BetsPriceTimeRange, PredictionPlatform } from '@dimensiondev/enums';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { scaleLinear, scaleTime } from 'd3-scale';
import { curveMonotoneX, line } from 'd3-shape';
import dayjs from 'dayjs';
import { AnimatePresence, motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Loading } from '@/components/Loading.js';
import { STALE_TIMES } from '@/constants/query.js';
import { toFixedTrimmed } from '@/helpers/polymarket.js';
import { matchesTeamLabel } from '@/helpers/prediction/sportScoreUtils.js';
import { getBetsMarketPriceHistory } from '@/providers/prediction/getBetsMarketPriceHistory.js';
import type { BetsMarketDataForUI, SportTeam } from '@/types/prediction.js';

export interface SportChartConfig {
    moneylineMarkets?: BetsMarketDataForUI[];
    isDraw?: boolean;
    isEventEnded?: boolean;
    endTime?: number;
}

interface SportPriceLineChartProps {
    market: BetsMarketDataForUI;
    homeTeam: SportTeam;
    awayTeam: SportTeam;
    timeRange: BetsPriceTimeRange;
    config?: SportChartConfig;
}

interface DataPoint {
    time: number;
    home: number;
    draw: number;
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

function formatXAxisLabel(timestamp: number, timeRange: BetsPriceTimeRange) {
    const useDate =
        timeRange === BetsPriceTimeRange.OneWeek ||
        timeRange === BetsPriceTimeRange.OneMonth ||
        timeRange === BetsPriceTimeRange.All;
    return useDate ? dayjs(timestamp).format('MMM D') : dayjs(timestamp).format('h:mm A');
}

function generateFourHourTicks(start: Date, end: Date): Date[] {
    const ticks: Date[] = [];
    const d = new Date(start);
    d.setMinutes(0, 0, 0);
    d.setHours(Math.ceil(d.getHours() / 4) * 4, 0, 0, 0);

    const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
    for (let ms = d.getTime(); ms <= end.getTime(); ms += FOUR_HOURS_MS) {
        ticks.push(new Date(ms));
    }

    return ticks;
}

function clampPrice(value: number) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
}

const topMargin = 0;
const bottomMargin = 0;
const minDistance = labelHeight + labelMinGap;

function resolveLabelPositions(homeValue: number, drawValue: number, awayValue: number, includeDraw: boolean) {
    const entries: Array<{ key: 'home' | 'draw' | 'away'; top: number }> = [
        { key: 'home', top: plotHeight * (1 - homeValue) },
        { key: 'away', top: plotHeight * (1 - awayValue) },
    ];
    if (includeDraw) {
        entries.push({ key: 'draw', top: plotHeight * (1 - drawValue) });
    }

    // Sort by natural position (top to bottom), compute initial adjustedY
    const sorted = [...entries]
        .sort((a, b) => a.top - b.top)
        .map((e) => {
            let adjustedY = e.top - labelHeight / 2;
            adjustedY = Math.max(Math.min(adjustedY, plotHeight - labelHeight - bottomMargin), topMargin);
            return { data: e, targetY: e.top, adjustedY };
        });

    // Bidirectional iterative collision resolution (up to 10 passes)
    let changed = true;
    let iterations = 0;
    while (changed && iterations < 10) {
        changed = false;
        iterations += 1;

        // Forward pass: split overlap equally
        for (let i = 1; i < sorted.length; i += 1) {
            const cur = sorted[i]!;
            const prev = sorted[i - 1]!;
            const overlap = prev.adjustedY + minDistance - cur.adjustedY;
            if (overlap > 0) {
                changed = true;
                const half = overlap / 2;
                const newPrev = Math.max(topMargin, prev.adjustedY - half);
                const shift = prev.adjustedY - newPrev;
                prev.adjustedY = newPrev;
                cur.adjustedY += overlap - shift;
            }
        }

        // Boundary enforcement
        for (let i = 0; i < sorted.length; i += 1) {
            const item = sorted[i]!;
            if (item.adjustedY < topMargin) {
                item.adjustedY = topMargin;

                for (let j = i + 1; j < sorted.length; j += 1) {
                    sorted[j]!.adjustedY = Math.max(sorted[j]!.adjustedY, sorted[j - 1]!.adjustedY + minDistance);
                }
            }
            const maxBottom = plotHeight - labelHeight - bottomMargin;
            if (item.adjustedY > maxBottom) {
                item.adjustedY = maxBottom;

                for (let j = i - 1; j >= 0; j -= 1) {
                    sorted[j]!.adjustedY = Math.min(sorted[j]!.adjustedY, sorted[j + 1]!.adjustedY - minDistance);
                }
            }
        }
    }

    // Final pass: enforce minimum distance
    for (let i = 1; i < sorted.length; i += 1) {
        const cur = sorted[i]!;
        const prev = sorted[i - 1]!;
        const minTop = prev.adjustedY + minDistance;
        if (cur.adjustedY < minTop) cur.adjustedY = minTop;
    }

    const result: Record<string, number> = {};
    for (const item of sorted) {
        result[`${item.data.key}Top`] = plotTop + item.adjustedY;
    }

    return result as { homeTop: number; drawTop: number; awayTop: number };
}

function EndDots({
    homeColor,
    drawColor,
    awayColor,
    homeY,
    drawY,
    awayY,
    rightEdge,
    showDraw,
}: {
    homeColor: string;
    drawColor: string;
    awayColor: string;
    homeY: number;
    drawY: number;
    awayY: number;
    rightEdge: number;
    showDraw: boolean;
}) {
    return (
        <g className="pointer-events-none">
            <circle cx={rightEdge} cy={homeY} r={4} fill={homeColor} opacity={1} />
            <circle cx={rightEdge} cy={homeY} r={4} fill={homeColor}>
                <animate attributeName="r" values="4;16;4" dur="2.25s" begin="0.7s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0;0.6" dur="2.25s" begin="0.7s" repeatCount="indefinite" />
            </circle>
            {showDraw ? (
                <>
                    <circle cx={rightEdge} cy={drawY} r={4} fill={drawColor} opacity={1} />
                    <circle cx={rightEdge} cy={drawY} r={4} fill={drawColor}>
                        <animate attributeName="r" values="4;16;4" dur="2.25s" begin="0.7s" repeatCount="indefinite" />
                        <animate
                            attributeName="opacity"
                            values="0.6;0;0.6"
                            dur="2.25s"
                            begin="0.7s"
                            repeatCount="indefinite"
                        />
                    </circle>
                </>
            ) : null}
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
    const textStyle: CSSProperties = {
        color,
        WebkitTextStroke: '3px var(--chart-bg, var(--color-bg, #fff))',
        paintOrder: 'stroke fill',
    };

    return (
        <motion.div
            className="pointer-events-none absolute left-0 top-0 z-10"
            initial={{ opacity: 0, x: left, y: top }}
            animate={{
                opacity: 1,
                x: left,
                y: top,
                transition: {
                    x: { type: 'tween', duration: 0.2, ease: 'easeOut' },
                    y: { type: 'tween', duration: 0.2, ease: 'easeOut' },
                    opacity: { duration: 0.15 },
                },
            }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
        >
            <div className="flex flex-col items-start gap-[3.3px]">
                <span className="whitespace-nowrap text-[13px] font-medium leading-[14px]" style={textStyle}>
                    {name}
                </span>
                <span className="whitespace-nowrap text-[26px] font-semibold leading-none" style={textStyle}>
                    {pct}
                </span>
            </div>
        </motion.div>
    );
}

function HoverTimeLabel({ dataPoint, left }: { dataPoint: DataPoint; left: number }) {
    const time = dayjs(dataPoint.time * 1000).format('MMM D, h:mm A');

    return (
        <motion.div
            className="pointer-events-none absolute z-10 whitespace-nowrap text-[13px] font-medium leading-[18px]"
            initial={{ opacity: 0 }}
            animate={{
                opacity: 1,
                left,
                transition: {
                    opacity: { type: 'tween', duration: 0.125, ease: 'easeOut', delay: 0.02 },
                    left: { type: 'spring', stiffness: 500, damping: 40, mass: 0.8 },
                },
            }}
            exit={{ opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } }}
            style={{
                top: 0,
                color: 'var(--color-third, #b1b1b1)',
                WebkitTextStroke: '3px var(--chart-bg, var(--color-bg, #fff))',
                paintOrder: 'stroke fill',
            }}
        >
            {time}
        </motion.div>
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
    config,
}: SportPriceLineChartProps) {
    const { moneylineMarkets, isDraw, endTime } = config || {};
    const containerRef = useRef<HTMLDivElement>(null);
    const resizeRef = useRef<ResizeObserver | null>(null);
    const [width, setWidth] = useState(0);
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);

    // When the caller passes a merged moneyline market (with originalMoneylineMarkets),
    // resolve back to the underlying individual markets so that API calls use correct
    // createTime / closedTime and draw/away markets can be found by groupItemTitle.
    const chartMarket = market.originalMoneylineMarkets?.length
        ? market.originalMoneylineMarkets.find((m) => matchesTeamLabel(homeTeam, m.groupItemTitle || m.title)) ||
          market.originalMoneylineMarkets[0]
        : market;
    const resolvedMoneylineMarkets =
        moneylineMarkets?.length === 1 && moneylineMarkets[0]?.originalMoneylineMarkets?.length
            ? moneylineMarkets[0].originalMoneylineMarkets
            : moneylineMarkets;

    const homeColor = homeTeam.color || '#BB761B';
    const awayColor = awayTeam.color || '#87BFFF';
    const drawColor = '#8B5CF6';
    const homeOutcome = chartMarket.outcomes[0];

    // For three-way (draw) markets, use all 3 moneyline markets.
    // For two-way, use single market with away = 1 - home.
    const drawMarket = isDraw
        ? resolvedMoneylineMarkets?.find((m) => m.groupItemTitle?.toLowerCase().includes('draw'))
        : undefined;
    const awayMarket = isDraw
        ? resolvedMoneylineMarkets?.find((m) => m !== chartMarket && m !== drawMarket)
        : undefined;

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
        queryKey: ['sport', 'price-history', chartMarket.id, drawMarket?.id ?? '', awayMarket?.id ?? '', timeRange],
        staleTime: STALE_TIMES.MINUTE_2,
        retry: false,
        queryFn: async ({ signal }) => {
            // Fetch home market
            const homeData = await getBetsMarketPriceHistory(PredictionPlatform.Polymarket, {
                markets: [chartMarket],
                timeRange,
                outcomeId: homeOutcome?.id || '',
                isSingleMarket: true,
                endTime,
                signal,
            });

            if (isDraw && drawMarket && awayMarket) {
                // Three-way: fetch draw and away markets separately
                const drawOutcome = drawMarket.outcomes[0];
                const awayOutcome = awayMarket.outcomes[0];
                const [drawData, awayData] = await Promise.all([
                    getBetsMarketPriceHistory(PredictionPlatform.Polymarket, {
                        markets: [drawMarket],
                        timeRange,
                        outcomeId: drawOutcome?.id || '',
                        isSingleMarket: true,
                        endTime,
                        signal,
                    }),
                    getBetsMarketPriceHistory(PredictionPlatform.Polymarket, {
                        markets: [awayMarket],
                        timeRange,
                        outcomeId: awayOutcome?.id || '',
                        isSingleMarket: true,
                        endTime,
                        signal,
                    }),
                ]);

                // Each token's price history has different timestamps (trades
                // happen at different moments). Forward-fill merge: collect all
                // unique timestamps, sort them, and carry forward the last known
                // value for each series so lines don't drop to 0 between updates.
                const homeMap = new Map(homeData.map((i) => [i.time as number, clampPrice(Number(i[chartMarket.id]))]));
                const drawMap = new Map(drawData.map((i) => [i.time as number, clampPrice(Number(i[drawMarket.id]))]));
                const awayMap = new Map(awayData.map((i) => [i.time as number, clampPrice(Number(i[awayMarket.id]))]));

                // Include ALL timestamps from all series. Each line starts from
                // its own first trade, matching the Polymarket behavior.
                const allTimes = new Set<number>();
                for (const t of homeMap.keys()) allTimes.add(t);

                for (const t of drawMap.keys()) allTimes.add(t);

                for (const t of awayMap.keys()) allTimes.add(t);

                const sorted = Array.from(allTimes).sort((a, b) => a - b);
                if (!sorted.length) return [];

                // Forward-fill: carry each series' last known value forward
                let lastHome = -1 as number;
                let lastDraw = -1 as number;
                let lastAway = -1 as number;

                const result: DataPoint[] = [];
                for (const t of sorted) {
                    const h = homeMap.get(t);
                    if (h !== undefined) lastHome = h;
                    const d = drawMap.get(t);
                    if (d !== undefined) lastDraw = d;
                    const a = awayMap.get(t);
                    if (a !== undefined) lastAway = a;
                    // Only include point when at least one series has data
                    if (lastHome < 0 && lastDraw < 0 && lastAway < 0) continue;
                    result.push({
                        time: t,
                        home: Math.max(0, lastHome),
                        draw: Math.max(0, lastDraw),
                        away: Math.max(0, lastAway),
                    });
                }

                return result;
            }

            // Two-way: away = 1 - home
            if (!homeData?.length) return [];
            return homeData.map((item) => {
                const home = clampPrice(Number(item[chartMarket.id]));
                return { time: item.time as number, home, draw: 0, away: clampPrice(1 - home) };
            });
        },
    });

    const latestHome = useMemo(() => {
        if (!data?.length) return clampPrice(Number.parseFloat(homeOutcome?.price || '0.5'));
        return data[data.length - 1].home;
    }, [data, homeOutcome?.price]);

    const latestDraw = useMemo(() => {
        if (!isDraw) return 0;
        if (!data?.length) return clampPrice(Number.parseFloat(drawMarket?.outcomes[0]?.price || '0'));
        return data[data.length - 1].draw;
    }, [data, isDraw, drawMarket]);

    const latestAway = useMemo(() => {
        if (!data?.length) {
            if (isDraw && awayMarket) return clampPrice(Number.parseFloat(awayMarket.outcomes[0]?.price || '0'));
            return clampPrice(1 - latestHome);
        }
        return data[data.length - 1].away;
    }, [data, isDraw, awayMarket, latestHome]);

    const activeDataIndex = data?.length ? Math.min(tooltip?.dataIndex ?? data.length - 1, data.length - 1) : -1;
    const activeDataPoint = activeDataIndex >= 0 && data?.length ? data[activeDataIndex] : null;
    const activeHome = activeDataPoint?.home ?? latestHome;
    const activeDraw = activeDataPoint?.draw ?? latestDraw;
    const activeAway = activeDataPoint?.away ?? latestAway;
    const homePct = `${toFixedTrimmed(activeHome * 100, 1)}%`;
    const drawPct = `${toFixedTrimmed(activeDraw * 100, 1)}%`;
    const awayPct = `${toFixedTrimmed(activeAway * 100, 1)}%`;
    const labelPositions = useMemo(
        () => resolveLabelPositions(activeHome, activeDraw, activeAway, !!isDraw),
        [activeHome, activeDraw, activeAway],
    );

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

    const { xScale, yScale, xTicks, homePath, homeMutedPath, drawPath, drawMutedPath, awayPath, awayMutedPath } =
        useMemo(() => {
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
                    drawPath: null as string | null,
                    drawMutedPath: null as string | null,
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
            const createPath = (points: DataPoint[], key: 'home' | 'draw' | 'away') => {
                if (points.length < 2) return null;
                return lineGenerator.y((d) => y(d[key]))(points) ?? null;
            };
            const selectedIndex = Math.max(0, activeDataIndex);
            const coloredData = data.slice(0, selectedIndex + 1);
            const mutedData = selectedIndex < data.length - 1 ? data.slice(selectedIndex) : [];

            const rawTicks =
                timeRange === BetsPriceTimeRange.OneDay ? generateFourHourTicks(firstTs, lastTs) : x.ticks(5);
            const edgeMargin = Math.min(40, dimensions.dataWidth * 0.1);
            const filteredTicks = rawTicks.filter((t) => {
                const xPos = x(t);
                return xPos >= edgeMargin && xPos <= dimensions.dataWidth - edgeMargin;
            });

            return {
                xScale: x,
                yScale: y,
                xTicks: filteredTicks,
                homePath: createPath(coloredData, 'home'),
                homeMutedPath: createPath(mutedData, 'home'),
                drawPath: createPath(coloredData, 'draw'),
                drawMutedPath: createPath(mutedData, 'draw'),
                awayPath: createPath(coloredData, 'away'),
                awayMutedPath: createPath(mutedData, 'away'),
            };
        }, [activeDataIndex, data, dimensions.dataWidth, timeRange]);

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

    const homeName = homeTeam.name || homeTeam.abbreviation || t`Home`;
    const awayName = awayTeam.name || awayTeam.abbreviation || t`Away`;
    const drawName = t`Draw`;
    const homeDotY = yScale(activeHome);
    const drawDotY = yScale(activeDraw);
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
                                {isDraw ? <ChartLinePath d={drawPath} color={drawColor} /> : null}
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
                                {isDraw ? (
                                    <ChartLinePath
                                        d={drawMutedPath}
                                        color={mutedLineColor}
                                        opacity={0.28}
                                        outline={false}
                                    />
                                ) : null}
                            </g>

                            <EndDots
                                homeColor={homeColor}
                                drawColor={drawColor}
                                awayColor={awayColor}
                                homeY={homeDotY}
                                drawY={drawDotY}
                                awayY={awayDotY}
                                rightEdge={activeX}
                                showDraw={!!isDraw}
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
                                        {formatXAxisLabel(tick.getTime(), timeRange)}
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

                <AnimatePresence>
                    {tooltip && activeDataPoint ? (
                        <HoverTimeLabel dataPoint={activeDataPoint} left={activeX + oddsLabelOffset} />
                    ) : null}
                </AnimatePresence>

                <SideOddsLabel
                    name={homeName}
                    pct={homePct}
                    color={homeColor}
                    top={labelPositions.homeTop}
                    left={activeX + oddsLabelOffset}
                />
                <AnimatePresence>
                    {isDraw ? (
                        <SideOddsLabel
                            name={drawName}
                            pct={drawPct}
                            color={drawColor}
                            top={labelPositions.drawTop}
                            left={activeX + oddsLabelOffset}
                        />
                    ) : null}
                </AnimatePresence>
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
