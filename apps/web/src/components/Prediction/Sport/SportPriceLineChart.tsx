'use client';

import { BetsPriceTimeRange } from '@dimensiondev/enums';
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
import { useLocalizedSportsTeamName } from '@/hooks/prediction/useLocalizedSportsTeamName.js';
import { formatPolymarketTimeRange } from '@/providers/prediction/getBetsMarketPriceHistory.js';
import { getPriceHistory } from '@/providers/prediction/polymarket/getPriceHistory.js';
import type { BetsMarketDataForUI, BetsMarketOutcome, SportTeam } from '@/types/prediction.js';

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

// One outcome token's raw trade point. Raw series drive the visible curve
// (smoothed by curveMonotoneX); the merged DataPoint[] drives hover/labels.
interface RawPoint {
    t: number;
    v: number;
}

interface RawSeries {
    home: RawPoint[];
    draw: RawPoint[];
    away: RawPoint[];
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
// Candidate "nice" Y-axis tick spacings (from Polymarket). niceYAxisDomain picks
// the step closest to 5 ticks and zooms the axis to the data range.
const Y_AXIS_STEP_SIZES = [0.01, 0.02, 0.03, 0.04, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5];
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

// "Nice" Y-axis domain for the data range (Polymarket-style): round the domain
// to the step whose tick count is closest to 5. Clamped to [0, 1].
function niceYAxisDomain(min: number, max: number): { domain: [number, number]; ticks: number[] } {
    if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
        return { domain: [0, 1], ticks: [0, 0.25, 0.5, 0.75, 1] };
    }
    // Pad a single-value range ±5% so ticks span a visible band.
    if (min === max) {
        const pad = min * 0.05 || 0.05;
        min -= pad;
        max += pad;
    }
    let best: { domain: [number, number]; ticks: number[]; dist: number } | null = null;
    for (const step of Y_AXIS_STEP_SIZES) {
        const dMin = Math.max(0, Math.floor(min / step) * step);
        const dMax = Math.ceil(max / step) * step;
        if (dMax > 1 + 1e-9) continue; // never label above 100%
        const n = Math.round((dMax - dMin) / step);
        const dist = Math.abs(n + 1 - 5); // prefer ~5 ticks
        if (best === null || dist < best.dist) {
            const ticks: number[] = [];
            for (let i = 0; i <= n; i += 1) ticks.push(Number((dMin + i * step).toFixed(6)));

            best = { domain: [dMin, dMax], ticks, dist };
        }
    }

    return best ?? { domain: [0, 1], ticks: [0, 0.25, 0.5, 0.75, 1] };
}

// Linear interpolation of a time-sorted raw series at t. Holds the first/last
// value outside its range; returns -1 when empty.
function rawValueAt(pts: RawPoint[], t: number): number {
    if (!pts.length) return -1;
    if (t <= pts[0]!.t) return pts[0]!.v;
    if (t >= pts[pts.length - 1]!.t) return pts[pts.length - 1]!.v;
    let lo = 0;
    while (lo < pts.length - 1 && pts[lo + 1]!.t <= t) lo += 1;

    const a = pts[lo]!;
    const b = pts[lo + 1]!;
    if (b.t === a.t) return a.v;
    return a.v + ((b.v - a.v) * (t - a.t)) / (b.t - a.t);
}

const topMargin = 0;
const bottomMargin = 0;
const minDistance = labelHeight + labelMinGap;

function resolveLabelPositions(
    yOf: (value: number) => number,
    homeValue: number,
    drawValue: number,
    awayValue: number,
    includeDraw: boolean,
) {
    const entries: Array<{ key: 'home' | 'draw' | 'away'; top: number }> = [
        { key: 'home', top: yOf(homeValue) },
        { key: 'away', top: yOf(awayValue) },
    ];
    if (includeDraw) {
        entries.push({ key: 'draw', top: yOf(drawValue) });
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
                <span
                    className="line-clamp-2 max-w-[7.5rem] break-words text-[13px] font-medium leading-[14px]"
                    style={textStyle}
                >
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
    const { isDraw } = config || {};
    const resolveTeamName = useLocalizedSportsTeamName();
    const containerRef = useRef<HTMLDivElement>(null);
    const resizeRef = useRef<ResizeObserver | null>(null);
    const [width, setWidth] = useState(0);
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);

    const homeColor = homeTeam.color || '#BB761B';
    const awayColor = awayTeam.color || '#87BFFF';
    const drawColor = '#8B5CF6';

    // Use the underlying home leg for the time window when passed a merged
    // moneyline (it carries the real close time for ended events).
    const timeMarket = market.originalMoneylineMarkets?.length
        ? (market.originalMoneylineMarkets.find((m) => matchesTeamLabel(homeTeam, m.groupItemTitle || m.title)) ??
          market.originalMoneylineMarkets[0])
        : market;

    // Resolve outcome tokens from the merged market's `outcomes`. Matching by team
    // label (the leftover outcome is draw) avoids the locale pitfall of the old
    // groupItemTitle-based lookup, which broke on localized titles.
    const { homeOutcome, awayOutcome, drawOutcome } = useMemo(() => {
        const outcomes = market.outcomes ?? [];
        if (!isDraw || outcomes.length < 3) {
            return { homeOutcome: outcomes[0], awayOutcome: undefined, drawOutcome: undefined };
        }
        let home: BetsMarketOutcome | undefined;
        let away: BetsMarketOutcome | undefined;
        let draw: BetsMarketOutcome | undefined;
        for (const outcome of outcomes) {
            if (matchesTeamLabel(homeTeam, outcome.label)) home ??= outcome;
            else if (matchesTeamLabel(awayTeam, outcome.label)) away ??= outcome;
            else draw ??= outcome;
        }

        return {
            homeOutcome: home ?? outcomes[0],
            awayOutcome: away ?? outcomes[1],
            drawOutcome: draw ?? outcomes[2],
        };
    }, [market.outcomes, isDraw, homeTeam, awayTeam]);

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

    const {
        data: queryData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['sport', 'price-history', homeOutcome?.id, drawOutcome?.id, awayOutcome?.id, timeRange],
        staleTime: STALE_TIMES.MINUTE_2,
        retry: false,
        queryFn: async ({ signal }): Promise<{ points: DataPoint[]; raw: RawSeries }> => {
            const now = Math.floor(Date.now() / 1000);
            const createSec = Math.floor((timeMarket.createTime ?? 0) / 1000);
            const endSec =
                timeMarket.closedTime && timeMarket.closedTime < Date.now()
                    ? Math.floor(timeMarket.closedTime / 1000)
                    : now;
            const range = formatPolymarketTimeRange(timeRange, createSec, endSec);
            const fetchTokenHistory = (tokenId: string) =>
                getPriceHistory({ market: tokenId, signal, ...range }).then((res) => res.history);

            if (isDraw && homeOutcome && drawOutcome && awayOutcome) {
                // Three-way: fetch all three outcome histories and merge on the union
                // of timestamps. `points` (merged) drives hover/labels; `raw`
                // (per-series) drives the curve.
                const [homeHistory, drawHistory, awayHistory] = await Promise.all([
                    fetchTokenHistory(homeOutcome.id),
                    fetchTokenHistory(drawOutcome.id),
                    fetchTokenHistory(awayOutcome.id),
                ]);

                const homeMap = new Map((homeHistory ?? []).map((p) => [p.t, clampPrice(p.p)]));
                const drawMap = new Map((drawHistory ?? []).map((p) => [p.t, clampPrice(p.p)]));
                const awayMap = new Map((awayHistory ?? []).map((p) => [p.t, clampPrice(p.p)]));

                const toPoints = (m: Map<number, number>) => [...m.entries()].sort((a, b) => a[0] - b[0]);
                const homePts = toPoints(homeMap);
                const drawPts = toPoints(drawMap);
                const awayPts = toPoints(awayMap);

                const raw: RawSeries = {
                    home: homePts.map(([t, v]) => ({ t, v })),
                    draw: drawPts.map(([t, v]) => ({ t, v })),
                    away: awayPts.map(([t, v]) => ({ t, v })),
                };

                // Include ALL timestamps from all series on a shared time axis.
                const allTimes = new Set<number>();
                for (const [t] of homePts) allTimes.add(t);

                for (const [t] of drawPts) allTimes.add(t);

                for (const [t] of awayPts) allTimes.add(t);

                const sorted = Array.from(allTimes).sort((a, b) => a - b);
                if (!sorted.length) return { points: [], raw };

                // Interpolate each series at every shared timestamp so gaps form a
                // gradual slope instead of a flat-then-cliff. Holds the opening price
                // before the first trade and the last price after the last trade.
                const valueAt = (pts: Array<[number, number]>, t: number): number => {
                    if (!pts.length) return -1;
                    if (t <= pts[0]![0]) return pts[0]![1];
                    if (t >= pts[pts.length - 1]![0]) return pts[pts.length - 1]![1];
                    let lo = 0;
                    while (lo < pts.length - 1 && pts[lo + 1]![0] <= t) lo += 1;

                    const [t0, v0] = pts[lo]!;
                    const [t1, v1] = pts[lo + 1]!;
                    if (t1 === t0) return v0;
                    return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
                };

                const result: DataPoint[] = [];
                for (const t of sorted) {
                    const home = valueAt(homePts, t);
                    const draw = valueAt(drawPts, t);
                    const away = valueAt(awayPts, t);
                    // Only include point when at least one series has data
                    if (home < 0 && draw < 0 && away < 0) continue;
                    result.push({
                        time: t,
                        home: Math.max(0, home),
                        draw: Math.max(0, draw),
                        away: Math.max(0, away),
                    });
                }

                return { points: result, raw };
            }

            // Two-way: away = 1 - home. raw.away mirrors raw.home.
            const homeHistory = await fetchTokenHistory(homeOutcome?.id || '');
            if (!homeHistory?.length) return { points: [], raw: { home: [], draw: [], away: [] } };
            const homeRaw: RawPoint[] = homeHistory
                .map((p) => ({ t: p.t, v: clampPrice(p.p) }))
                .sort((a, b) => a.t - b.t);
            const points: DataPoint[] = homeHistory.map((p) => {
                const home = clampPrice(p.p);
                return { time: p.t, home, draw: 0, away: clampPrice(1 - home) };
            });
            return {
                points,
                raw: {
                    home: homeRaw,
                    draw: [],
                    away: homeRaw.map((p) => ({ t: p.t, v: clampPrice(1 - p.v) })),
                },
            };
        },
    });

    const data = queryData?.points;
    const raw = queryData?.raw;

    const latestHome = useMemo(() => {
        if (!data?.length) return clampPrice(Number.parseFloat(homeOutcome?.price || '0.5'));
        return data[data.length - 1].home;
    }, [data, homeOutcome?.price]);

    const latestDraw = useMemo(() => {
        if (!isDraw) return 0;
        if (!data?.length) return clampPrice(Number.parseFloat(drawOutcome?.price || '0'));
        return data[data.length - 1].draw;
    }, [data, isDraw, drawOutcome]);

    const latestAway = useMemo(() => {
        if (!data?.length) {
            if (isDraw && awayOutcome) return clampPrice(Number.parseFloat(awayOutcome?.price || '0'));
            return clampPrice(1 - latestHome);
        }
        return data[data.length - 1].away;
    }, [data, isDraw, awayOutcome, latestHome]);

    const activeDataIndex = data?.length ? Math.min(tooltip?.dataIndex ?? data.length - 1, data.length - 1) : -1;
    const activeDataPoint = activeDataIndex >= 0 && data?.length ? data[activeDataIndex] : null;
    const activeHome = activeDataPoint?.home ?? latestHome;
    const activeDraw = activeDataPoint?.draw ?? latestDraw;
    const activeAway = activeDataPoint?.away ?? latestAway;
    const homePct = `${toFixedTrimmed(activeHome * 100, 1)}%`;
    const drawPct = `${toFixedTrimmed(activeDraw * 100, 1)}%`;
    const awayPct = `${toFixedTrimmed(activeAway * 100, 1)}%`;

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

    const {
        xScale,
        yScale,
        yTicks,
        xTicks,
        labelPositions,
        homePath,
        homeMutedPath,
        drawPath,
        drawMutedPath,
        awayPath,
        awayMutedPath,
    } = useMemo(() => {
        const fallbackY = scaleLinear().range([plotHeight, 0]).domain([0, 1]);

        if (!data?.length || dimensions.dataWidth <= 0 || !raw) {
            return {
                xScale: scaleTime()
                    .range([0, 1])
                    .domain([new Date(0), new Date(1)]),
                yScale: fallbackY,
                yTicks: [0, 0.25, 0.5, 0.75, 1],
                xTicks: [] as Date[],
                labelPositions: resolveLabelPositions(
                    (v) => fallbackY(v),
                    activeHome,
                    activeDraw,
                    activeAway,
                    !!isDraw,
                ),
                homePath: null as string | null,
                homeMutedPath: null as string | null,
                drawPath: null as string | null,
                drawMutedPath: null as string | null,
                awayPath: null as string | null,
                awayMutedPath: null as string | null,
            };
        }

        // Zoom Y to the rendered series' raw range (home + away; draw only for 3-way).
        let min = Infinity;
        let max = -Infinity;
        const consider = (pts: RawPoint[]) => {
            for (const p of pts) {
                if (p.v < min) min = p.v;
                if (p.v > max) max = p.v;
            }
        };
        consider(raw.home);
        consider(raw.away);
        if (isDraw) consider(raw.draw);
        if (!Number.isFinite(min) || !Number.isFinite(max)) {
            min = 0;
            max = 1;
        }
        const { domain, ticks } = niceYAxisDomain(min, max);
        const y = scaleLinear().range([plotHeight, 0]).domain(domain);

        const firstTs = new Date(data[0].time * 1000);
        const lastTs = new Date(data[data.length - 1].time * 1000);
        const x = scaleTime().range([0, dimensions.dataWidth]).domain([firstTs, lastTs]);

        // Plot raw trade points with curveMonotoneX. The colored/muted halves are
        // bridged at the hover cursor via rawValueAt so they join.
        const hoverTime = data[Math.max(0, Math.min(activeDataIndex, data.length - 1))].time;
        const lineGen = line<RawPoint>()
            .x((d) => x(new Date(d.t * 1000)))
            .y((d) => y(d.v))
            .curve(curveMonotoneX);
        const buildPath = (pts: RawPoint[], mode: 'colored' | 'muted'): string | null => {
            if (pts.length < 2) return null;
            if (mode === 'colored') {
                const seg = pts.filter((p) => p.t <= hoverTime);
                const last = seg[seg.length - 1];
                if (last && last.t < hoverTime) seg.push({ t: hoverTime, v: rawValueAt(pts, hoverTime) });
                return seg.length >= 2 ? (lineGen(seg) ?? null) : null;
            }
            const seg = pts.filter((p) => p.t >= hoverTime);
            const first = seg[0];
            const bridgeVal = rawValueAt(pts, hoverTime);
            if (first && first.t > hoverTime && bridgeVal >= 0) seg.unshift({ t: hoverTime, v: bridgeVal });
            return seg.length >= 2 ? (lineGen(seg) ?? null) : null;
        };

        const rawTicks = timeRange === BetsPriceTimeRange.OneDay ? generateFourHourTicks(firstTs, lastTs) : x.ticks(5);
        const edgeMargin = Math.min(40, dimensions.dataWidth * 0.1);
        const filteredTicks = rawTicks.filter((t) => {
            const xPos = x(t);
            return xPos >= edgeMargin && xPos <= dimensions.dataWidth - edgeMargin;
        });

        return {
            xScale: x,
            yScale: y,
            yTicks: ticks,
            xTicks: filteredTicks,
            labelPositions: resolveLabelPositions((v) => y(v), activeHome, activeDraw, activeAway, !!isDraw),
            homePath: buildPath(raw.home, 'colored'),
            homeMutedPath: buildPath(raw.home, 'muted'),
            drawPath: buildPath(raw.draw, 'colored'),
            drawMutedPath: buildPath(raw.draw, 'muted'),
            awayPath: buildPath(raw.away, 'colored'),
            awayMutedPath: buildPath(raw.away, 'muted'),
        };
    }, [activeDataIndex, activeHome, activeDraw, activeAway, data, dimensions.dataWidth, timeRange, raw, isDraw]);

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

    const homeName = (homeTeam.name ? resolveTeamName(homeTeam.name) : '') || homeTeam.abbreviation || t`Home`;
    const awayName = (awayTeam.name ? resolveTeamName(awayTeam.name) : '') || awayTeam.abbreviation || t`Away`;
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
                            {yTicks.map((tick) => (
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
                                {yTicks.map((tick) => (
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
