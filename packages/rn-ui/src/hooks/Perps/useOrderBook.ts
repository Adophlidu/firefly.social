import type { ISubscription } from '@nktkas/hyperliquid';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useRef, useState } from 'react';

import { dividedBy, plus } from '@/helpers/number';
import { subscriptionClientAtom } from '@/store/wallet';
import type { L2BookEvent } from '@/types/ui';

function resolveStepParam(stepIndex: number): {
    nSigFigs: 5 | 4 | 3 | 2;
    mantissa?: 2 | 5;
} {
    switch (stepIndex) {
        case 0:
            return { nSigFigs: 5, mantissa: undefined };
        case 1:
            return { nSigFigs: 5, mantissa: 2 };
        case 2:
            return { nSigFigs: 5, mantissa: 5 };
        case 3:
            return { nSigFigs: 4, mantissa: undefined };
        case 4:
            return { nSigFigs: 3, mantissa: undefined };
        case 5:
            return { nSigFigs: 2, mantissa: undefined };
        default:
            return { nSigFigs: 5, mantissa: undefined };
    }
}

function processOrderBook(list: L2BookEvent['levels'][number]) {
    let cumulativeSum = '0';
    return list.map((item) => {
        cumulativeSum = plus(cumulativeSum, item.sz || '0').toString();
        return {
            ...item,
            cumulativeSz: cumulativeSum,
        };
    });
}

export function useOrderBook(coinName: string, maxRows = 7, stepIndex = 0, reverseAsks = true) {
    const [orderBook, setOrderBook] = useState<L2BookEvent | null>(null);
    const subscriptionClient = useAtomValue(subscriptionClientAtom);
    const lastSubscription = useRef<ISubscription[]>([]);

    useEffect(() => {
        if (!subscriptionClient) return;

        // Unsubscribe from previous subscriptions
        const subscriptions = [...lastSubscription.current];
        subscriptions.forEach((sub) =>
            sub.unsubscribe().finally(() => {
                lastSubscription.current = lastSubscription.current.filter((s) => s !== sub);
            }),
        );
        subscriptionClient
            .l2Book({ coin: coinName, ...resolveStepParam(stepIndex) }, (data) => {
                setOrderBook(data);
            })
            .then((sub) => {
                lastSubscription.current.push(sub);
            });

        return () => {
            lastSubscription.current.forEach((sub) => sub.unsubscribe());
        };
    }, [coinName, subscriptionClient, stepIndex]);

    return useMemo(() => {
        if (!orderBook)
            return {
                asks: [],
                bids: [],
            };

        const processedAsks = processOrderBook(orderBook.levels?.[1] || []);
        const processedBids = processOrderBook(orderBook.levels?.[0] || []);
        const asks = processedAsks.slice(0, maxRows);
        const bids = processedBids.slice(0, maxRows);

        const bidMax = bids[bids.length - 1]?.cumulativeSz || '0';
        const askMax = asks[asks.length - 1]?.cumulativeSz || '0';

        if (reverseAsks) {
            asks.reverse();
        }

        return {
            asks: asks.map((ask) => ({
                ...ask,
                ratio: Math.min(1, Math.max(0, dividedBy(ask.cumulativeSz, askMax).toNumber())),
            })),
            bids: bids.map((bid) => ({
                ...bid,
                ratio: Math.min(1, Math.max(0, dividedBy(bid.cumulativeSz, bidMax).toNumber())),
            })),
        };
    }, [orderBook, maxRows, reverseAsks]);
}
