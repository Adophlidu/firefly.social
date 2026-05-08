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
    const providersRef = useRef<RtdsWebSocketProvider[]>([]);

    useEffect(() => {
        const ticker = resolveChainLinkCrypto(crypto);
        const provider = new RtdsWebSocketProvider();
        const symbol = `${ticker.toLowerCase()}/usd`;

        providersRef.current = [...providersRef.current, provider];

        provider.subscribe(
            symbol,
            (price, timestamp) => {
                const timeSec = timestamp / 1000;
                setLatestPrice(price);
                onPriceUpdate?.(price);
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
                setPoints(historical);
                setLatestPrice(historical[historical.length - 1].value);
                onPriceUpdate?.(historical[historical.length - 1].value);
            },
        );

        return () => {
            provider.close();
            providersRef.current.forEach((p) => p.close());
        };
    }, [crypto, onPriceUpdate]);

    return { points, latestPrice };
}
