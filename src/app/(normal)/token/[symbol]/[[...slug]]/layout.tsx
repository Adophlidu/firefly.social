import { notFound } from 'next/navigation.js';
import type { PropsWithChildren } from 'react';

import { CategoryTabs, type TokenPageSearch } from '@/app/(normal)/token/[symbol]/[[...slug]]/CategoryTabs.js';
import { WrapTokenMarketData } from '@/app/(normal)/token/[symbol]/[[...slug]]/WrapTokenMarketData.js';
import { Comeback } from '@/components/Comeback.js';
import { TokenContextProvider } from '@/components/Token/TokenContext.js';
import { SwapButton } from '@/components/TokenProfile/SwapButton.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { CoinGeckoAsset, CoinGeckoToken } from '@/providers/types/CoinGecko.js';
import { getTokenFromCoinGecko } from '@/services/getTokenFromCoinGecko.js';
import { searchTokenByAddress } from '@/services/searchTokenByAddress.js';
import type { NextPageProps } from '@/types/index.js';

interface Props
    extends NextPageProps<
        {
            symbol: string;
            slug: [category: string] | undefined;
        },
        TokenPageSearch
    > {}

export default async function TokenPageLayout(props: PropsWithChildren<Props>) {
    await setupLocaleForSSR();

    const { children } = props;
    const params = await props.params;
    const search = await props.searchParams;
    console.log('search', search);
    const paramSymbol = decodeURIComponent(params.symbol);
    let symbol = paramSymbol;
    let tokenAsset: CoinGeckoAsset;
    if (isValidAddressEthereum(paramSymbol)) {
        tokenAsset = await searchTokenByAddress(paramSymbol);
        if (tokenAsset) symbol = tokenAsset.attributes.symbol;
    }
    const token = await runInSafeAsync(async () => {
        const data = await getTokenFromCoinGecko(symbol);
        if (data) return data;
        if (tokenAsset) {
            return {
                id: tokenAsset.attributes.coingecko_coin_id,
                chainId: tokenAsset.attributes.chain_id,
                address: tokenAsset.attributes.address,
                symbol: tokenAsset.attributes.symbol,
                name: tokenAsset.attributes.name,
                source: 'CoinGecko',
                type: 'FungibleToken',
                logoURL: tokenAsset.attributes.image_url,
            } satisfies CoinGeckoToken;
        }
        return null;
    });

    if (!token) {
        notFound();
    }
    const slug = params.slug?.[0];

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
            <div className="sticky top-[54px] z-30 bg-primaryBottom md:top-[60px]">
                <WrapTokenMarketData className="sticky" token={token} />
                <CategoryTabs slug={slug} tokenId={token.id} className="!z-20 md:!top-[57px]" />
            </div>
            <div className="p-3">{children}</div>
        </TokenContextProvider>
    );
}
