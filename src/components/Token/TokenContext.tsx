'use client';
import { noop } from 'lodash-es';
import { createContext, type Dispatch, type PropsWithChildren, type SetStateAction, useMemo, useState } from 'react';

interface TokenContextProps {
    openTrader: boolean;
    setOpenTrader: Dispatch<SetStateAction<boolean>>;
    tradable: boolean;
    setTradable: Dispatch<SetStateAction<boolean>>;
}
export const TokenContext = createContext<TokenContextProps>({
    openTrader: false,
    setOpenTrader: noop,
    tradable: false,
    setTradable: noop,
});

export function TokenContextProvider({ children }: PropsWithChildren) {
    const [openTrader, setOpenTrader] = useState(false);
    const [tradable, setTradable] = useState(false);
    const contextValue = useMemo(() => ({ openTrader, setOpenTrader, tradable, setTradable }), [openTrader, tradable]);

    return <TokenContext.Provider value={contextValue}>{children}</TokenContext.Provider>;
}
