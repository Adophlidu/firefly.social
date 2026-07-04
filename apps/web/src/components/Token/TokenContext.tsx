'use client';

import { EMPTY_LIST } from '@dimensiondev/constants';
import type { CoinGeckoToken, GetTokenOptions } from '@dimensiondev/workers-token';
import { noop } from 'lodash-es';
import { createContext, type Dispatch, type PropsWithChildren, type SetStateAction, useMemo, useState } from 'react';

import type { Trending } from '@/providers/types/Trending.js';
import type { TradeRecord } from '@/types/token.js';

interface TokenContextProps {
    tradeRecords: TradeRecord[];
    setTradeRecords: Dispatch<SetStateAction<TradeRecord[]>>;
    token?: CoinGeckoToken | null;
    tokenQueryOptions?: GetTokenOptions;
    initialTrending?: Trending;
}

export const TokenContext = createContext<TokenContextProps>({
    tradeRecords: EMPTY_LIST,
    setTradeRecords: noop,
});

export function TokenContextProvider({
    children,
    token,
    tokenQueryOptions,
    initialTrending,
}: PropsWithChildren<Pick<TokenContextProps, 'token' | 'tokenQueryOptions' | 'initialTrending'>>) {
    const [tradeRecords, setTradeRecords] = useState<TradeRecord[]>(EMPTY_LIST);
    const contextValue = useMemo(
        () => ({
            tradeRecords,
            setTradeRecords,
            token,
            tokenQueryOptions,
            initialTrending,
        }),
        [tradeRecords, token, tokenQueryOptions, initialTrending],
    );

    return <TokenContext.Provider value={contextValue}>{children}</TokenContext.Provider>;
}
