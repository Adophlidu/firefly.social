'use client';

import { EMPTY_LIST } from '@dimensiondev/constants';
import { noop } from 'lodash-es';
import { createContext, type Dispatch, type PropsWithChildren, type SetStateAction, useMemo, useState } from 'react';

import { type TradeRecord } from '@/types/token.js';

interface TokenContextProps {
    tradeRecords: TradeRecord[];
    setTradeRecords: Dispatch<SetStateAction<TradeRecord[]>>;
}

export const TokenContext = createContext<TokenContextProps>({
    tradeRecords: EMPTY_LIST,
    setTradeRecords: noop,
});

export function TokenContextProvider({ children }: PropsWithChildren) {
    const [tradeRecords, setTradeRecords] = useState<TradeRecord[]>(EMPTY_LIST);
    const contextValue = useMemo(
        () => ({
            tradeRecords,
            setTradeRecords,
        }),
        [tradeRecords],
    );

    return <TokenContext.Provider value={contextValue}>{children}</TokenContext.Provider>;
}
