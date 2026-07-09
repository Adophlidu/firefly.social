import type { LivelinePoint } from 'liveline';
import { useEffect, useRef, useState } from 'react';

import type { PredictionCrypto } from '@/constants/bets.js';
import { resolveChainLinkCrypto } from '@/providers/firefly/prediction/resolveCrypto.js';
import { RtdsWebSocketProvider } from '@/providers/prediction/polymarket/RtdsWebSocketProvider.js';

const MAX_POINTS = 1000;

interface Options {
    onPriceUpdate?: (price: number) => void;
}

export function useCryptoLivePrices(crypto: PredictionCrypto, { onPriceUpdate }: Options = {}) {
    const [points, setPoints] = useState<LivelinePoint[]>([]);
    const [latestPrice, setLatestPrice] = useState<number | null>(null);
    const providerRef = useRef<RtdsWebSocketProvider | null>(null);
    const onPriceUpdateRef = useRef(onPriceUpdate);
    onPriceUpdateRef.current = onPriceUpdate;

    useEffect(() => {
        const ticker = resolveChainLinkCrypto(crypto);
        const provider = new RtdsWebSocketProvider();
        const symbol = `${ticker.toLowerCase()}/usd`;

        providerRef.current = provider;

        provider.subscribe(
            symbol,
            (price, timestamp) => {
                const timeSec = timestamp / 1000;
                setLatestPrice(price);
                onPriceUpdateRef.current?.(price);
                setPoints((prev) => {
                    const next = [...prev, { time: timeSec, value: price }];
                    return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next;
                });
            },
            (history) => {
                const historical: LivelinePoint[] = history.map((p) => ({
                    time: p.timestamp / 1000,
                    value: p.price,
                }));
                // Always replace points so switching feeds clears the previous crypto's line,
                // even when the new feed's first history frame is empty.
                setPoints(historical);
                const last = historical[historical.length - 1];
                if (!last) return;
                setLatestPrice(last.value);
                onPriceUpdateRef.current?.(last.value);
            },
        );

        return () => {
            provider.close();
            providerRef.current = null;
        };
    }, [crypto]);

    return { points, latestPrice };
}
