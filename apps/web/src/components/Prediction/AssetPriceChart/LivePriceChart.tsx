'use client';

import { Liveline } from 'liveline';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import {
    CRYPTO_PRICE_CHART_LABEL_INSET,
    CRYPTO_PRICE_CHART_MARGIN,
    getCryptoPricePlotHeight,
} from '@/components/Prediction/AssetPriceChart/chartLayout.js';
import { CryptoPriceTargetOverlay } from '@/components/Prediction/AssetPriceChart/CryptoPriceTargetOverlay.js';
import { CRYPTO_PRICE_CHART_HEIGHT, type PredictionCrypto } from '@/constants/bets.js';
import { useCryptoLivePrices } from '@/hooks/prediction/useCryptoLivePrices.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { computeChartYRange, priceToChartY } from '@/providers/prediction/computeChartYRange.js';
import { computeCryptoPriceYTicks } from '@/providers/prediction/computeCryptoPriceYTicks.js';
import { formatCryptoPrice } from '@/providers/prediction/formatCryptoPrice.js';
import { resolveCryptoColor } from '@/providers/prediction/resolveCryptoColor.js';
import { PredictionRecurrence } from '@/types/prediction.js';

interface LivePriceChartProps {
    crypto: PredictionCrypto;
    recurrence: PredictionRecurrence;
    priceToBeat?: number;
    onPriceUpdate?: (price: number) => void;
}

function recurrenceToSeconds(recurrence: PredictionRecurrence): number {
    switch (recurrence) {
        case PredictionRecurrence.FiveMinutes:
            return 300;
        case PredictionRecurrence.FifteenMinutes:
            return 900;
        case PredictionRecurrence.FourHours:
            return 14400;
        case PredictionRecurrence.Daily:
            return 86400;
        case PredictionRecurrence.Hour:
            return 3600;
        default:
            return 300;
    }
}

function getWindowSlots(recurrence: PredictionRecurrence, count = 5): number[] {
    const intervalSecs = recurrenceToSeconds(recurrence);
    const nowMs = Date.now();
    const latestSlotMs = Math.floor(nowMs / (intervalSecs * 1000)) * (intervalSecs * 1000);
    const slots: number[] = [];
    for (let i = count - 1; i >= 0; i -= 1) {
        slots.push(latestSlotMs - i * intervalSecs * 1000);
    }

    return slots;
}

export const LivePriceChart = memo<LivePriceChartProps>(function LivePriceChart({
    crypto,
    recurrence,
    priceToBeat,
    onPriceUpdate,
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const slots = useMemo(() => getWindowSlots(recurrence, 5), [recurrence]);
    const isDark = useIsDarkMode();

    const { points, latestPrice } = useCryptoLivePrices(crypto, {
        onPriceUpdate,
    });

    useLayoutEffect(() => {
        const element = containerRef.current;
        if (!element) return;

        const updateWidth = () => {
            setContainerWidth(element.clientWidth);
        };

        updateWidth();
        const observer = new ResizeObserver(updateWidth);
        observer.observe(element);
        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (slots.length > 0 && selectedSlot === null) {
            setSelectedSlot(slots[slots.length - 2] ?? slots[0]);
        }
    }, [slots, selectedSlot]);

    const windowSecs = recurrenceToSeconds(recurrence);
    const displayedPoints = useMemo(() => {
        if (!points.length || selectedSlot === null) return points;
        const slotStart = selectedSlot / 1000;
        const slotEnd = slotStart + windowSecs;
        const filtered = points.filter((p) => p.time >= slotStart && p.time <= slotEnd);
        return filtered.length > 0 ? filtered : points;
    }, [points, selectedSlot, windowSecs]);
    const liveWindow = useMemo(() => {
        if (!displayedPoints.length) return windowSecs;
        const nowSec = Date.now() / 1000;
        return Math.ceil(nowSec - displayedPoints[0].time);
    }, [displayedPoints, windowSecs]);

    const formatValue = useCallback((price: number) => formatCryptoPrice(crypto, price), [crypto]);

    const plotHeight = getCryptoPricePlotHeight();
    const values = useMemo(() => {
        const seriesValues = displayedPoints.map((point) => point.value);
        if (priceToBeat !== undefined && Number.isFinite(priceToBeat)) {
            return [...seriesValues, priceToBeat];
        }
        return seriesValues;
    }, [displayedPoints, priceToBeat]);
    const { ticks } = useMemo(() => computeCryptoPriceYTicks({ values }), [values]);
    const yRange = useMemo(
        () =>
            computeChartYRange(displayedPoints, latestPrice ?? 0, {
                extraValues: priceToBeat !== undefined && Number.isFinite(priceToBeat) ? [priceToBeat] : undefined,
            }),
        [displayedPoints, latestPrice, priceToBeat],
    );
    const yScale = useCallback(
        (value: number) => priceToChartY(value, yRange, CRYPTO_PRICE_CHART_MARGIN.top, plotHeight),
        [yRange, plotHeight],
    );

    const showTarget =
        priceToBeat !== undefined && priceToBeat !== null && Number.isFinite(priceToBeat) && containerWidth > 0;
    const plotRight = containerWidth - CRYPTO_PRICE_CHART_MARGIN.right;
    const chartRight = containerWidth - CRYPTO_PRICE_CHART_LABEL_INSET;

    return (
        <div ref={containerRef} className="relative overflow-visible" style={{ height: CRYPTO_PRICE_CHART_HEIGHT }}>
            <Liveline
                data={displayedPoints}
                value={latestPrice ?? 0}
                window={liveWindow}
                color={resolveCryptoColor(crypto)}
                fill
                pulse
                theme={isDark ? 'dark' : 'light'}
                formatValue={formatValue}
                padding={CRYPTO_PRICE_CHART_MARGIN}
                loading={points.length === 0}
                style={{ height: CRYPTO_PRICE_CHART_HEIGHT, width: '100%' }}
            />
            {showTarget ? (
                <svg
                    className="pointer-events-none absolute inset-0 overflow-visible"
                    width={containerWidth}
                    height={CRYPTO_PRICE_CHART_HEIGHT}
                    aria-hidden
                >
                    <CryptoPriceTargetOverlay
                        priceToBeat={priceToBeat}
                        ticks={ticks}
                        yScale={yScale}
                        left={CRYPTO_PRICE_CHART_MARGIN.left}
                        plotRight={plotRight}
                        chartRight={chartRight}
                        plotTop={CRYPTO_PRICE_CHART_MARGIN.top}
                        plotHeight={plotHeight}
                        range={yRange}
                    />
                </svg>
            ) : null}
        </div>
    );
});
