import type { ISubscription } from '@nktkas/hyperliquid';
import type { CandleSnapshotResponse } from '@nktkas/hyperliquid/api/info';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { CandleDatum, KlineInterval } from '@/components/PerpKlineChart/types.js';
import { createLatestRafThrottle } from '@/helpers/rafThrottleLatest.js';
import { infoClient, subscriptionClient } from '@/providers/hyperliquid/index.js';

const HISTORY_SIZE = 200;

type SdkInterval = '1m' | '15m' | '1h' | '4h' | '1d';

const SDK_INTERVAL: Record<KlineInterval, SdkInterval> = {
    '1m': '1m',
    '15m': '15m',
    '1h': '1h',
    '4h': '4h',
    D: '1d',
};

const INTERVAL_MS: Record<KlineInterval, number> = {
    '1m': 60_000,
    '15m': 900_000,
    '1h': 3_600_000,
    '4h': 14_400_000,
    D: 86_400_000,
};

type CandleRow = CandleSnapshotResponse[number];

function normalize(row: CandleRow): CandleDatum {
    return {
        time: row.t,
        open: Number(row.o),
        high: Number(row.h),
        low: Number(row.l),
        close: Number(row.c),
        volume: Number(row.v),
    };
}

function merge(prev: CandleDatum[], next: CandleDatum): CandleDatum[] {
    if (prev.length === 0) return [next];
    const last = prev[prev.length - 1];
    if (next.time === last.time) {
        const copy = prev.slice();
        copy[copy.length - 1] = next;

        return copy;
    }
    if (next.time > last.time) {
        return [...prev, next];
    }

    return prev;
}

export interface UseCandleHistoryResult {
    data: CandleDatum[];
    isLoading: boolean;
    error: Error | null;
    retry: () => void;
}

export function useCandleHistory(coin: string, interval: KlineInterval): UseCandleHistoryResult {
    const [candles, setCandles] = useState<CandleDatum[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [retryToken, setRetryToken] = useState(0);
    const candlesRef = useRef<CandleDatum[]>([]);

    const retry = useCallback(() => {
        setRetryToken((token) => token + 1);
    }, []);

    useEffect(() => {
        if (!coin) return;

        let cancelled = false;
        let subscription: ISubscription | null = null;
        const sdkInterval = SDK_INTERVAL[interval];
        const startTime = Date.now() - INTERVAL_MS[interval] * HISTORY_SIZE;

        candlesRef.current = [];
        setCandles([]);
        setIsLoading(true);
        setError(null);

        const throttle = createLatestRafThrottle<CandleDatum[]>((rows) => {
            if (!cancelled) setCandles(rows);
        });

        const run = async () => {
            try {
                const snapshot = await infoClient.candleSnapshot({
                    coin,
                    interval: sdkInterval,
                    startTime,
                });
                if (cancelled) return;
                const initial = snapshot.map(normalize);
                candlesRef.current = initial;
                setCandles(initial);
                setIsLoading(false);

                const sub = await subscriptionClient.candle({ coin, interval: sdkInterval }, (event) => {
                    const merged = merge(candlesRef.current, normalize(event));
                    if (merged === candlesRef.current) return;
                    candlesRef.current = merged;
                    throttle.schedule(merged);
                });
                if (cancelled) {
                    sub.unsubscribe();

                    return;
                }
                subscription = sub;
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e : new Error('Failed to load candles'));
                    setIsLoading(false);
                }
            }
        };

        run();

        return () => {
            cancelled = true;
            throttle.dispose();
            subscription?.unsubscribe();
            subscription = null;
        };
    }, [coin, interval, retryToken]);

    return { data: candles, isLoading, error, retry };
}
