import { isArray, isObject, throttle } from 'lodash-es';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
    collectLiveSportsMarketAssetIds,
    resolveWsOutcomeDisplayPrice,
} from '@/helpers/prediction/category/sportsMarketLivePrices.js';
import {
    type MarketMessage,
    type MarketPriceChangeData,
    MarketsWebSocketProvider,
} from '@/providers/prediction/polymarket/MarketsWebSocketProvider.js';
import type { PolymarketSportsEvent } from '@/providers/types/Firefly.js';

/** Cap UI refresh rate while WS may push many price_change events per second. */
const LIVE_SPORTS_PRICE_THROTTLE_MS = 400;

function mergePendingPrices(prev: Record<string, string>, pending: Record<string, string>): Record<string, string> {
    let next: Record<string, string> | null = null;

    for (const [assetId, price] of Object.entries(pending)) {
        if (prev[assetId] === price) continue;
        if (!next) next = { ...prev };
        next[assetId] = price;
    }

    return next ?? prev;
}

function collectPendingPrices(pending: Record<string, string>, changes: MarketPriceChangeData[]): void {
    for (const change of changes) {
        const assetId = change.asset_id?.trim();
        const price = resolveWsOutcomeDisplayPrice(change);
        if (!assetId || !price) continue;
        pending[assetId] = price;
    }
}

export function useLiveSportsMarketPrices(events: PolymarketSportsEvent[]) {
    const [pricesByAssetId, setPricesByAssetId] = useState<Record<string, string>>({});
    const pendingRef = useRef<Record<string, string>>({});

    const assetIdsKey = useMemo(() => collectLiveSportsMarketAssetIds(events).join(','), [events]);

    useEffect(() => {
        if (!assetIdsKey) {
            setPricesByAssetId({});
            pendingRef.current = {};
            return;
        }

        const assetIds = assetIdsKey.split(',').filter(Boolean);
        const provider = new MarketsWebSocketProvider();

        const flushPendingPrices = throttle(
            () => {
                const pending = pendingRef.current;
                if (!Object.keys(pending).length) return;

                pendingRef.current = {};
                setPricesByAssetId((prev) => mergePendingPrices(prev, pending));
            },
            LIVE_SPORTS_PRICE_THROTTLE_MS,
            { leading: true, trailing: true },
        );

        const unsubscribe = provider.subscribeToMarket(assetIds, (message?: MarketMessage) => {
            if (!message) return;

            if (
                !isArray(message) &&
                isObject(message) &&
                message.event_type === 'price_change' &&
                message.price_changes.length
            ) {
                collectPendingPrices(pendingRef.current, message.price_changes);
                flushPendingPrices();
            }
        });

        return () => {
            flushPendingPrices.cancel();
            pendingRef.current = {};
            unsubscribe();
            provider.close();
        };
    }, [assetIdsKey]);

    return pricesByAssetId;
}
