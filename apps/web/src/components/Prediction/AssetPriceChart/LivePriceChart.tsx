import { Liveline } from 'liveline';
import { memo, useEffect, useMemo, useState } from 'react';

import { CRYPTO_PRICE_CHART_HEIGHT, type PredictionCrypto } from '@/constants/bets.js';
import { useCryptoLivePrices } from '@/hooks/prediction/useCryptoLivePrices.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { resolveCryptoColor } from '@/providers/prediction/resolveCryptoColor.js';
import { PredictionRecurrence } from '@/types/prediction.js';

interface LivePriceChartProps {
    crypto: PredictionCrypto;
    recurrence: PredictionRecurrence;
    onPriceUpdate?: (price: number) => void;
}

function formatPrice(price: number) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

export const LivePriceChart = memo<LivePriceChartProps>(function LivePriceChart({ crypto, recurrence, onPriceUpdate }) {
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const slots = useMemo(() => getWindowSlots(recurrence, 5), [recurrence]);
    const isDark = useIsDarkMode();

    const { points, latestPrice } = useCryptoLivePrices(crypto, {
        onPriceUpdate,
    });

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

    return (
        <div className="relative" style={{ height: CRYPTO_PRICE_CHART_HEIGHT }}>
            {/* Liveline chart */}
            <Liveline
                data={displayedPoints}
                value={latestPrice ?? 0}
                window={liveWindow}
                color={resolveCryptoColor(crypto)}
                fill
                pulse
                theme={isDark ? 'dark' : 'light'}
                formatValue={formatPrice}
                loading={points.length === 0}
                style={{ height: CRYPTO_PRICE_CHART_HEIGHT, width: '100%' }}
            />
        </div>
    );
});
