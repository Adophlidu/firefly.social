'use client';

import { debounce, first, isArray, isObject } from 'lodash-es';
import { createContext, memo, type PropsWithChildren, useEffect, useMemo, useState } from 'react';

import { PredictionPlatform } from '@/constants/enum.js';
import {
    type MarketMessage,
    type MarketPriceChangeData,
    MarketsWebSocketProvider,
} from '@/providers/prediction/polymarket/MarketsWebSocketProvider.js';
import type { BetsMarketDataForUI } from '@/types/prediction.js';

interface PredictionContextProviderProps {
    platform: PredictionPlatform;
    markets: BetsMarketDataForUI[];
}
interface PredictionContextValue {
    platform: PredictionPlatform;
    marketId: string | null;
    market: BetsMarketDataForUI | null;
    setMarketId: (id: string | null) => void;
}

export const PredictionContext = createContext<PredictionContextValue>({
    platform: PredictionPlatform.Polymarket,
    marketId: null,
    market: null,
    setMarketId: () => {},
});

export const PredictionContextProvider = memo<PropsWithChildren<PredictionContextProviderProps>>(
    function PredictionContextProvider({ platform, markets, children }) {
        const [marketId, setMarketId] = useState(
            markets.find((market) => !market.isResolved && !market.isClosed)?.id || null,
        );
        const [marketPrices, setMarketPrices] = useState<MarketPriceChangeData[]>();

        useEffect(() => {
            const market = markets.find((m) => m.id === marketId);
            if (!market) return;

            const firstOutcome = first(market.outcomes);
            if (!firstOutcome) return;

            const provider = new MarketsWebSocketProvider();
            provider.subscribeToMarket(
                [firstOutcome.id],
                debounce((message?: MarketMessage) => {
                    if (!message) return;

                    if (
                        !isArray(message) &&
                        isObject(message) &&
                        message.event_type === 'price_change' &&
                        message.price_changes.length
                    ) {
                        setMarketPrices(message.price_changes);
                    }
                }, 300),
            );

            return () => {
                provider.close();
            };
        }, [marketId, markets]);

        const contextValue = useMemo<PredictionContextValue>(() => {
            const market = markets.find((market) => market.id === marketId);
            if (market) {
                market.outcomes = market.outcomes.map((outcome) => {
                    const priceData = marketPrices?.find((x) => x.asset_id === outcome.id);
                    if (!priceData) return outcome;

                    return {
                        ...outcome,
                        bestAsk: priceData.best_ask,
                        bestBid: priceData.best_bid,
                    };
                });
            }

            return {
                marketId,
                platform,
                market: market || null,
                setMarketId,
            };
        }, [marketId, platform, markets, marketPrices]);

        return <PredictionContext.Provider value={contextValue}>{children}</PredictionContext.Provider>;
    },
);
