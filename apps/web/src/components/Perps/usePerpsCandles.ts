'use client';

import { usePerpsClient } from '@dimensiondev/perps-react';
import type { ISubscription } from '@nktkas/hyperliquid';
import type { CandleSnapshotResponse } from '@nktkas/hyperliquid/api/info';
import { useCallback, useEffect, useRef, useState } from 'react';

export type PerpsCandleInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

export interface PerpsCandle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

const HISTORY_SIZE = 120;
const INTERVAL_MS: Record<PerpsCandleInterval, number> = {
    '1m': 60_000,
    '5m': 300_000,
    '15m': 900_000,
    '1h': 3_600_000,
    '4h': 14_400_000,
    '1d': 86_400_000,
    '1w': 604_800_000,
};

type CandleRow = CandleSnapshotResponse[number];

function normalize(row: CandleRow): PerpsCandle {
    return {
        time: row.t,
        open: Number(row.o),
        high: Number(row.h),
        low: Number(row.l),
        close: Number(row.c),
        volume: Number(row.v),
    };
}

function mergeCandles(current: PerpsCandle[], next: PerpsCandle) {
    const last = current.at(-1);
    if (!last) return [next];
    if (last.time === next.time) return [...current.slice(0, -1), next];
    if (last.time < next.time) return [...current.slice(-(HISTORY_SIZE - 1)), next];
    return current;
}

export function usePerpsCandles(coin: string, interval: PerpsCandleInterval) {
    const client = usePerpsClient();
    const [data, setData] = useState<PerpsCandle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error>();
    const [retryToken, setRetryToken] = useState(0);
    const candlesRef = useRef<PerpsCandle[]>([]);
    const retry = useCallback(() => setRetryToken((value) => value + 1), []);

    useEffect(() => {
        let cancelled = false;
        let subscription: ISubscription | undefined;
        const load = async () => {
            setIsLoading(true);
            setError(undefined);
            candlesRef.current = [];

            try {
                const rows = await client.info.candleSnapshot({
                    coin,
                    interval,
                    startTime: Date.now() - INTERVAL_MS[interval] * HISTORY_SIZE,
                });
                if (cancelled) return;
                candlesRef.current = rows.map(normalize);
                setData(candlesRef.current);
                setIsLoading(false);
                subscription = await client.subscriptions.candle({ coin, interval }, (row) => {
                    if (cancelled) return;
                    const next = mergeCandles(candlesRef.current, normalize(row));
                    if (next === candlesRef.current) return;
                    candlesRef.current = next;
                    setData(next);
                });
                if (cancelled) subscription.unsubscribe();
            } catch (cause) {
                if (cancelled) return;
                setError(cause instanceof Error ? cause : new Error('Failed to load candles'));
                setIsLoading(false);
            }
        };
        void load();

        return () => {
            cancelled = true;
            subscription?.unsubscribe();
        };
    }, [client, coin, interval, retryToken]);

    return { data, error, isLoading, retry };
}
