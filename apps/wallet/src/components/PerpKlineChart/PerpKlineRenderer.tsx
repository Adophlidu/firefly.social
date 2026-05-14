import {
    CandlestickSeries,
    ColorType,
    createChart,
    createSeriesMarkers,
    CrosshairMode,
    HistogramSeries,
    type IChartApi,
    type ISeriesApi,
    type ISeriesMarkersPluginApi,
    LineStyle,
    type SeriesMarker,
    type Time,
    type UTCTimestamp,
} from 'lightweight-charts';
import { memo, useEffect, useRef } from 'react';

import type { CandleDatum, FillMarker } from '@/components/PerpKlineChart/types.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';

const VOLUME_PANE_TOP = 0.78;
const UP_COLOR = '#26A69A';
const DOWN_COLOR = '#EF5350';
const UP_COLOR_FAINT = 'rgba(38, 166, 154, 0.55)';
const DOWN_COLOR_FAINT = 'rgba(239, 83, 80, 0.55)';

const TEXT_COLOR_LIGHT = '#767676';
const TEXT_COLOR_DARK = 'rgba(255, 255, 255, 0.78)';
const GRID_COLOR_LIGHT = '#f4f4f4';
const GRID_COLOR_DARK = 'rgba(255, 255, 255, 0.18)';

export interface PerpKlineRendererProps {
    candles: readonly CandleDatum[];
    markers: readonly FillMarker[];
}

function toUTCTime(timeMs: number): UTCTimestamp {
    return Math.floor(timeMs / 1000) as UTCTimestamp;
}

function toCandleSeriesData(candles: readonly CandleDatum[]) {
    return candles.map((c) => ({
        time: toUTCTime(c.time),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
    }));
}

function toVolumeSeriesData(candles: readonly CandleDatum[]) {
    return candles.map((c) => ({
        time: toUTCTime(c.time),
        value: c.volume,
        color: c.close >= c.open ? UP_COLOR_FAINT : DOWN_COLOR_FAINT,
    }));
}

const volumeFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

function formatVolume(value: number | null): string {
    if (value === null || !Number.isFinite(value)) return '—';

    return volumeFormatter.format(value);
}

function toFillMarkers(markers: readonly FillMarker[]): Array<SeriesMarker<Time>> {
    return markers.map((m) => {
        const isBuy = m.side === 'B';

        return {
            time: toUTCTime(m.time),
            position: isBuy ? 'belowBar' : 'aboveBar',
            color: isBuy ? UP_COLOR : DOWN_COLOR,
            shape: 'circle',
            text: isBuy ? 'B' : 'S',
        };
    });
}

export const PerpKlineRenderer = memo<PerpKlineRendererProps>(function PerpKlineRenderer({ candles, markers }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
    const candlesRef = useRef<readonly CandleDatum[]>(candles);
    const markersDataRef = useRef<readonly FillMarker[]>(markers);
    candlesRef.current = candles;
    markersDataRef.current = markers;
    const isDarkMode = useIsDarkMode();
    const textColor = isDarkMode ? TEXT_COLOR_DARK : TEXT_COLOR_LIGHT;
    const gridColor = isDarkMode ? GRID_COLOR_DARK : GRID_COLOR_LIGHT;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const chart = createChart(container, {
            autoSize: true,
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor,
                fontSize: 11,
            },
            grid: {
                vertLines: { color: gridColor, style: LineStyle.Solid },
                horzLines: { color: gridColor, style: LineStyle.Solid },
            },
            rightPriceScale: {
                borderVisible: false,
                scaleMargins: { top: 0.05, bottom: 0.28 },
            },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: false,
            },
            crosshair: {
                mode: CrosshairMode.Normal,
            },
            handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
            handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
        });

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: UP_COLOR,
            downColor: DOWN_COLOR,
            borderUpColor: UP_COLOR,
            borderDownColor: DOWN_COLOR,
            wickUpColor: UP_COLOR,
            wickDownColor: DOWN_COLOR,
        });

        const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
        });
        chart.priceScale('volume').applyOptions({
            scaleMargins: { top: VOLUME_PANE_TOP, bottom: 0 },
            borderVisible: false,
        });

        const markersApi = createSeriesMarkers(candleSeries, []);

        chartRef.current = chart;
        candleSeriesRef.current = candleSeries;
        volumeSeriesRef.current = volumeSeries;
        markersRef.current = markersApi;

        const initialCandles = candlesRef.current;
        if (initialCandles.length > 0) {
            candleSeries.setData(toCandleSeriesData(initialCandles));
            volumeSeries.setData(toVolumeSeriesData(initialCandles));
        }
        const initialMarkers = markersDataRef.current;
        if (initialMarkers.length > 0) {
            markersApi.setMarkers(toFillMarkers(initialMarkers));
        }

        return () => {
            markersRef.current = null;
            candleSeriesRef.current = null;
            volumeSeriesRef.current = null;
            chartRef.current = null;
            chart.remove();
        };
    }, [textColor, gridColor]);

    useEffect(() => {
        const candleSeries = candleSeriesRef.current;
        const volumeSeries = volumeSeriesRef.current;
        if (!candleSeries || !volumeSeries) return;

        candleSeries.setData(toCandleSeriesData(candles));
        volumeSeries.setData(toVolumeSeriesData(candles));
    }, [candles]);

    useEffect(() => {
        const api = markersRef.current;
        if (!api) return;
        api.setMarkers(toFillMarkers(markers));
    }, [markers]);

    const lastVolume = candles.length > 0 ? candles[candles.length - 1].volume : null;

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
            }}
        >
            <div
                ref={containerRef}
                style={{
                    width: '100%',
                    height: '100%',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    top: `${VOLUME_PANE_TOP * 100}%`,
                    left: 8,
                    marginTop: 4,
                    fontSize: 11,
                    fontWeight: 500,
                    color: textColor,
                    pointerEvents: 'none',
                }}
            >
                Volume <span style={{ color: UP_COLOR }}>{formatVolume(lastVolume)}</span>
            </div>
        </div>
    );
});
