import type { PropsWithChildren } from 'react';
import { isAddress } from 'viem/utils';

import { Comeback } from '@/components/Comeback.js';
import { TokenContextProvider } from '@/components/Token/TokenContext.js';
import { SwapButton } from '@/components/TokenProfile/SwapButton.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getTokenFromCoinGecko } from '@/services/getTokenFromCoinGecko.js';
import { searchTokenByAddress } from '@/services/searchTokenByAddress.js';
import type { NextPageProps } from '@/types/index.js';

interface Props
    extends NextPageProps<{
        symbol: string;
    }> {}

export default async function TokenPageLayout(props: PropsWithChildren<Props>) {
    const params = await props.params;
    const { children } = props;
    const paramSymbol = decodeURIComponent(params.symbol);
    let symbol = paramSymbol;
    if (isAddress(paramSymbol)) {
        const token = await searchTokenByAddress(paramSymbol);
        if (token) {
            symbol = token.attributes.symbol;
        }
    }
    const token = await runInSafeAsync(() => getTokenFromCoinGecko(symbol));

    return (
        <TokenContextProvider>
            <div className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-line bg-primaryBottom px-4">
                <div className="flex items-center gap-7">
                    <Comeback className="cursor-pointer text-lightMain" />
                    <span className="text-xl font-black uppercase text-lightMain">${token?.symbol || paramSymbol}</span>
                </div>
                <SwapButton className="ml-auto sm:inline-flex md:hidden" />
            </div>
            {children}
        </TokenContextProvider>
    );
}
