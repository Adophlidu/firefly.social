'use client';

import { createContext, memo, type PropsWithChildren, useMemo, useState } from 'react';

import { PredictionPlatform } from '@/constants/enum.js';
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

        const contextValue = useMemo<PredictionContextValue>(
            () => ({
                marketId,
                platform,
                market: markets.find((market) => market.id === marketId) || null,
                setMarketId,
            }),
            [marketId, platform, markets],
        );

        return <PredictionContext.Provider value={contextValue}>{children}</PredictionContext.Provider>;
    },
);
