'use client';
import { noop } from 'lodash-es';
import { createContext, type Dispatch, type PropsWithChildren, type SetStateAction, useMemo, useState } from 'react';
import { mainnet } from 'viem/chains';

import { EMPTY_LIST } from '@/constants/index.js';
import type { SwapModalOpenProps } from '@/modals/SwapModal.js';
import type { TradeRecord } from '@/types/token.js';

interface TokenContextProps {
    tradable: boolean;
    setTradable: Dispatch<SetStateAction<boolean>>;
    swapProps: SwapModalOpenProps;
    setSwapProps: Dispatch<SetStateAction<SwapModalOpenProps>>;
    tradeRecords: TradeRecord[];
    setTradeRecords: Dispatch<SetStateAction<TradeRecord[]>>;
}
export const TokenContext = createContext<TokenContextProps>({
    tradable: false,
    setTradable: noop,
    swapProps: { chainId: mainnet.id },
    setSwapProps: noop,
    tradeRecords: EMPTY_LIST,
    setTradeRecords: noop,
});

export function TokenContextProvider({ children }: PropsWithChildren) {
    const [tradable, setTradable] = useState(false);
    const [swapProps, setSwapProps] = useState<SwapModalOpenProps>({ chainId: mainnet.id });
    const [tradeRecords, setTradeRecords] = useState<TradeRecord[]>([]);
    const contextValue = useMemo(
        () => ({
            tradable,
            setTradable,
            swapProps,
            setSwapProps,
            tradeRecords,
            setTradeRecords,
        }),
        [swapProps, tradable, tradeRecords],
    );

    return <TokenContext.Provider value={contextValue}>{children}</TokenContext.Provider>;
}
