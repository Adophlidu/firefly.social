import type { PropsWithChildren } from 'react';

import { Comeback } from '@/components/Comeback.js';
import { TokenContextProvider } from '@/components/Token/TokenContext.js';
import { SwapButton } from '@/components/TokenProfile/SwapButton.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { getTokenFromCoinGecko } from '@/services/getTokenFromCoinGecko.js';
import { searchTokenByAddress } from '@/services/searchTokenByAddress.js';
import type { NextPageProps } from '@/types/index.js';

interface Props
    extends NextPageProps<{
        symbol: string;
    }> {}

export default async function TokenPageLayout(props: PropsWithChildren<Props>) {
    await setupLocaleForSSR();

    const { children } = props;
    const params = await props.params;
    const paramSymbol = decodeURIComponent(params.symbol);
    let symbol = paramSymbol;
    if (isValidAddressEthereum(paramSymbol)) {
        const token = await searchTokenByAddress(paramSymbol);
        if (token) {
            symbol = token.attributes.symbol;
        }
    }
    const token = await runInSafeAsync(() => getTokenFromCoinGecko(symbol));

    return (
        <TokenContextProvider>
            <div className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-line bg-primaryBottom px-4">
                <div className="flex min-w-0 items-center gap-7">
                    <Comeback className="cursor-pointer text-lightMain" />
                    <span className="min-w-0 truncate text-xl font-black uppercase text-lightMain">
                        ${token?.symbol || paramSymbol}
                    </span>
                </div>
                <SwapButton className="ml-auto sm:inline-flex md:hidden" />
            </div>
            {children}
        </TokenContextProvider>
    );
}
