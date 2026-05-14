import type { ISubscription } from '@nktkas/hyperliquid';
import { useEffect, useRef, useState } from 'react';

import type { FillMarker, UserFill } from '@/components/PerpKlineChart/types.js';
import { createLatestRafThrottle } from '@/helpers/rafThrottleLatest.js';
import { subscriptionClient } from '@/providers/hyperliquid/index.js';

const MAX_MARKERS_PER_COIN = 100;

function toMarker(fill: UserFill): FillMarker {
    return {
        time: fill.time,
        side: fill.side,
        price: Number(fill.px),
        size: Number(fill.sz),
    };
}

function buildMarkers(fills: readonly UserFill[], coin: string): FillMarker[] {
    const filtered: FillMarker[] = [];
    for (let i = fills.length - 1; i >= 0 && filtered.length < MAX_MARKERS_PER_COIN; i -= 1) {
        const fill = fills[i];
        if (fill.coin === coin) filtered.push(toMarker(fill));
    }

    return filtered.sort((a, b) => a.time - b.time);
}

export function useUserFillMarkers(coin: string, walletAddress: string | null): FillMarker[] {
    const [markers, setMarkers] = useState<FillMarker[]>([]);
    const fillsRef = useRef<UserFill[]>([]);

    useEffect(() => {
        if (!coin || !walletAddress) {
            fillsRef.current = [];
            setMarkers([]);

            return;
        }

        let cancelled = false;
        let subscription: ISubscription | null = null;
        fillsRef.current = [];
        setMarkers([]);

        const throttle = createLatestRafThrottle<FillMarker[]>((rows) => {
            if (!cancelled) setMarkers(rows);
        });

        subscriptionClient
            .userFills({ user: walletAddress as `0x${string}`, aggregateByTime: true }, (event) => {
                const next = event.isSnapshot ? event.fills.slice() : [...fillsRef.current, ...event.fills];
                fillsRef.current = next;
                throttle.schedule(buildMarkers(next, coin));
            })
            .then((sub) => {
                if (cancelled) {
                    sub.unsubscribe();

                    return;
                }
                subscription = sub;
            })
            .catch(() => {
                // Silently ignore subscription errors — markers are non-critical UX.
            });

        return () => {
            cancelled = true;
            throttle.dispose();
            subscription?.unsubscribe();
            subscription = null;
            fillsRef.current = [];
        };
    }, [coin, walletAddress]);

    return markers;
}
