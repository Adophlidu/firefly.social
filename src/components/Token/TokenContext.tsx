'use client';
import { noop } from 'lodash-es';
import { createContext, type Dispatch, type PropsWithChildren, type SetStateAction, useMemo, useState } from 'react';
import { mainnet } from 'viem/chains';

import type { SwapModalOpenProps } from '@/modals/SwapModal.js';

interface TokenContextProps {
    tradable: boolean;
    setTradable: Dispatch<SetStateAction<boolean>>;
    swapProps: SwapModalOpenProps;
    setSwapProps: Dispatch<SetStateAction<SwapModalOpenProps>>;
}
export const TokenContext = createContext<TokenContextProps>({
    tradable: false,
    setTradable: noop,
    swapProps: { chainId: mainnet.id },
    setSwapProps: noop,
});

export function TokenContextProvider({ children }: PropsWithChildren) {
    const [tradable, setTradable] = useState(false);
    const [swapProps, setSwapProps] = useState<SwapModalOpenProps>({ chainId: mainnet.id });
    const contextValue = useMemo(() => ({ tradable, setTradable, swapProps, setSwapProps }), [swapProps, tradable]);

    return <TokenContext.Provider value={contextValue}>{children}</TokenContext.Provider>;
}
