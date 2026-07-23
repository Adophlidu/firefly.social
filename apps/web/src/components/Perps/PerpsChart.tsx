'use client';

import ActivityIcon from '@dimensiondev/assets/activity.svg';
import CameraIcon from '@dimensiondev/assets/camera.svg';
import ChartIcon from '@dimensiondev/assets/chart.svg';
import EditIcon from '@dimensiondev/assets/edit.svg';
import FilterIcon from '@dimensiondev/assets/filter.svg';
import MenuIcon from '@dimensiondev/assets/menu.svg';
import MoreIcon from '@dimensiondev/assets/more.svg';
import MusicIcon from '@dimensiondev/assets/music.svg';
import SettingsIcon from '@dimensiondev/assets/setting.svg';
import UndoIcon from '@dimensiondev/assets/undo.svg';
import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo, useEffect, useMemo, useState } from 'react';

import styles from '@/components/Perps/PerpsResponsive.module.css';
import { type PerpsCandleInterval, usePerpsCandles } from '@/components/Perps/usePerpsCandles.js';

interface Props {
    coin: string;
    displayCoin?: string;
    markPrice?: string;
}

const intervals: ReadonlyArray<{ label: string; value: PerpsCandleInterval }> = [
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '1h', value: '1h' },
    { label: '4h', value: '4h' },
    { label: '1D', value: '1d' },
];

// TradingView-style resolution codes shown in the chart subtitle.
const RESOLUTION_LABELS: Record<PerpsCandleInterval, string> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '1h': '60',
    '4h': '240',
    '1d': 'D',
    '1w': 'W',
};

const CHART_WIDTH = 1000;
const CHART_HEIGHT = 430;
const PLOT_TOP = 42;
const PRICE_BOTTOM = 305;
const VOLUME_TOP = 332;
const CHART_BOTTOM = 410;
const PLOT_LEFT = 72;
const PLOT_RIGHT = 934;

function compactNumber(value: number) {
    return Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export const PerpsChart = memo(function PerpsChart({ coin, displayCoin = coin, markPrice }: Props) {
    const [interval, setChartInterval] = useState<PerpsCandleInterval>('15m');
    const [clock, setClock] = useState('--:--:--');
    const { data, error, isLoading, retry } = usePerpsCandles(coin, interval);
    const candles = useMemo(() => data.slice(-60), [data]);
    const bounds = useMemo(() => {
        const lows = candles.map((candle) => candle.low);
        const highs = candles.map((candle) => candle.high);
        const min = Math.min(...lows);
        const max = Math.max(...highs);
        return { min, range: Math.max(max - min, Number.EPSILON) };
    }, [candles]);
    const maxVolume = Math.max(...candles.map((candle) => candle.volume), Number.EPSILON);
    const candleWidth = candles.length ? (PLOT_RIGHT - PLOT_LEFT) / candles.length : 0;
    const y = (price: number) =>
        PLOT_TOP + ((bounds.min + bounds.range - price) / bounds.range) * (PRICE_BOTTOM - PLOT_TOP);
    const latest = candles.at(-1);
    const displayMark = Number(markPrice ?? latest?.close);
    const priceTicks = Array.from({ length: 5 }, (_, index) => bounds.min + (bounds.range * index) / 4).reverse();

    useEffect(() => {
        const updateClock = () => setClock(new Date().toLocaleTimeString([], { hour12: false }));
        updateClock();
        const timer = setInterval(updateClock, 1_000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section
            data-testid="perps-chart"
            aria-label={t`${displayCoin} price chart`}
            className={classNames(
                styles.chart,
                'flex min-w-0 flex-1 flex-col overflow-hidden border-b border-r border-[#f5f5f5] bg-white',
            )}
        >
            <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#f5f5f5] px-3 text-[#767676]">
                <div
                    role="group"
                    aria-label={t`Chart interval`}
                    className={classNames(styles.chartIntervals, 'flex items-center gap-1')}
                >
                    {intervals.map(({ label, value }, index) => (
                        <button
                            key={`${label}-${index}`}
                            type="button"
                            aria-pressed={interval === value}
                            className="rounded px-2 py-1 text-base font-semibold leading-5 outline-none hover:text-lightTextMain focus-visible:ring-2 focus-visible:ring-[#4c4aa9] aria-pressed:bg-[#f5f5f5] aria-pressed:text-lightTextMain"
                            onClick={() => setChartInterval(value)}
                        >
                            {label}
                        </button>
                    ))}
                    <span aria-hidden className="px-1 text-lg">
                        ⌄
                    </span>
                </div>
                <div className={classNames(styles.chartDesktopTools, 'items-center gap-3 text-lightTextMain')}>
                    <ChartIcon className="size-5" />
                    <MenuIcon className="size-5" />
                    <MusicIcon className="size-5" />
                    <SettingsIcon className="size-5" />
                    <span className="h-6 w-px bg-[#f5f5f5]" />
                    <UndoIcon className="size-5" />
                    <span className="text-xs font-semibold">Last ›</span>
                    <CameraIcon className="size-5" />
                </div>
            </header>
            <div className="relative min-h-0 flex-1 overflow-hidden">
                <div
                    aria-hidden
                    className={classNames(
                        styles.chartDrawingTools,
                        'absolute inset-y-0 left-0 z-1 w-14 flex-col items-center gap-3 border-r border-[#f5f5f5] bg-white py-3 text-[#767676]',
                    )}
                >
                    <span className="flex size-10 items-center justify-center rounded-lg bg-[#ececf0] text-xl">＋</span>
                    <EditIcon className="size-5" />
                    <FilterIcon className="size-5" />
                    <ActivityIcon className="size-5" />
                    <MenuIcon className="size-5" />
                    <ChartIcon className="size-5" />
                    <span className="text-xl">T</span>
                    <MoreIcon className="size-5" />
                    <span className="mt-auto text-xl">⊕</span>
                </div>
                {isLoading ? (
                    <span
                        role="status"
                        className="absolute inset-0 z-10 flex items-center justify-center text-sm text-[#767676]"
                    >
                        <Trans>Loading chart…</Trans>
                    </span>
                ) : null}
                {error ? (
                    <button
                        type="button"
                        title={error.message}
                        className="absolute inset-0 z-10 m-auto h-10 rounded-lg px-3 text-sm font-semibold text-[#4c4aa9] outline-none focus-visible:ring-2 focus-visible:ring-[#4c4aa9]"
                        onClick={retry}
                    >
                        <Trans>Retry chart</Trans>
                    </button>
                ) : null}
                {!isLoading && !error && candles.length ? (
                    <svg
                        role="img"
                        aria-label={t`${displayCoin} candlestick chart`}
                        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                        preserveAspectRatio="none"
                        className="size-full"
                    >
                        {priceTicks.map((price, index) => {
                            const lineY = PLOT_TOP + ((PRICE_BOTTOM - PLOT_TOP) * index) / 4;
                            return (
                                <g key={price}>
                                    <line
                                        x1={PLOT_LEFT}
                                        x2={PLOT_RIGHT}
                                        y1={lineY}
                                        y2={lineY}
                                        stroke="#eeeeee"
                                        strokeWidth="1"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                    <text x="994" y={lineY + 5} textAnchor="end" fill="#181818" fontSize="18">
                                        {price.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                    </text>
                                </g>
                            );
                        })}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                            const x = PLOT_LEFT + (PLOT_RIGHT - PLOT_LEFT) * ratio;
                            return (
                                <line
                                    key={ratio}
                                    x1={x}
                                    x2={x}
                                    y1="0"
                                    y2={CHART_BOTTOM}
                                    stroke="#f1f1f1"
                                    strokeWidth="1"
                                    vectorEffect="non-scaling-stroke"
                                />
                            );
                        })}
                        <text x={PLOT_LEFT + 10} y="23" fill="#181818" fontSize="19">
                            {`${displayCoin.replace('-USDC', 'USDT')} Perpetual · ${RESOLUTION_LABELS[interval]} · Hyperliquid`}
                        </text>
                        {latest ? (
                            <text x={PLOT_LEFT + 10} y="45" fill="#ff45a1" fontSize="16">
                                O{latest.open.toLocaleString()} H{latest.high.toLocaleString()} L
                                {latest.low.toLocaleString()} C{latest.close.toLocaleString()}
                            </text>
                        ) : null}
                        {candles.map((candle, index) => {
                            const x = PLOT_LEFT + candleWidth * (index + 0.5);
                            const isUp = candle.close >= candle.open;
                            const top = y(Math.max(candle.open, candle.close));
                            const bottom = y(Math.min(candle.open, candle.close));
                            const color = isUp ? '#70d600' : '#ff45a1';
                            const volumeHeight = (candle.volume / maxVolume) * (CHART_BOTTOM - VOLUME_TOP);
                            return (
                                <g key={candle.time}>
                                    <line
                                        x1={x}
                                        x2={x}
                                        y1={y(candle.high)}
                                        y2={y(candle.low)}
                                        stroke={color}
                                        strokeWidth="1"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                    <rect
                                        x={x - candleWidth * 0.34}
                                        y={top}
                                        width={Math.max(candleWidth * 0.68, 2)}
                                        height={Math.max(bottom - top, 2)}
                                        fill={color}
                                    />
                                    <rect
                                        x={x - candleWidth * 0.34}
                                        y={CHART_BOTTOM - volumeHeight}
                                        width={Math.max(candleWidth * 0.68, 2)}
                                        height={volumeHeight}
                                        fill={color}
                                        opacity="0.58"
                                    />
                                </g>
                            );
                        })}
                        <text x={PLOT_LEFT + 10} y={VOLUME_TOP - 8} fill="#181818" fontSize="17">
                            Volume
                        </text>
                        <text x={PLOT_LEFT + 83} y={VOLUME_TOP - 8} fill="#ff45a1" fontSize="17">
                            {compactNumber(latest?.volume ?? 0)}
                        </text>
                        <text x="994" y={VOLUME_TOP + 4} textAnchor="end" fill="#181818" fontSize="17">
                            {compactNumber(maxVolume)}
                        </text>
                        {Number.isFinite(displayMark) ? (
                            <g>
                                <line
                                    x1={PLOT_LEFT}
                                    x2={PLOT_RIGHT}
                                    y1={y(displayMark)}
                                    y2={y(displayMark)}
                                    stroke="#ff45a1"
                                    strokeDasharray="2 2"
                                    vectorEffect="non-scaling-stroke"
                                />
                                <rect x={PLOT_RIGHT} y={y(displayMark) - 11} width="66" height="22" fill="#ff45a1" />
                                <text
                                    x={PLOT_RIGHT + 33}
                                    y={y(displayMark) + 6}
                                    textAnchor="middle"
                                    fill="white"
                                    fontSize="15"
                                >
                                    {displayMark.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                </text>
                            </g>
                        ) : null}
                    </svg>
                ) : null}
            </div>
            <footer
                className={classNames(
                    styles.chartFooter,
                    'flex shrink-0 items-center border-t border-[#f5f5f5] text-[#767676]',
                )}
            >
                <div className={classNames(styles.chartFooterRanges, 'items-center gap-4')}>
                    <span>1D</span>
                    <span>5D</span>
                    <span>1M</span>
                    <span>3M</span>
                    <span>6M</span>
                    <span>1Y</span>
                </div>
                <div className={classNames(styles.chartFooterModes, 'items-center gap-3')}>
                    <span>{clock} UTC+8</span>
                    <span>%</span>
                    <span>log</span>
                    <span className={classNames('rounded bg-[#ececf0] px-1.5 py-2 text-lightTextMain')}>auto</span>
                </div>
            </footer>
        </section>
    );
});
