import { Trans } from '@lingui/react/macro';
import { notFound } from 'next/navigation.js';
import type { PropsWithChildren } from 'react';
import urlcat from 'urlcat';

import { WrapTokenMarketData } from '@/app/(normal)/token/[symbol]/[[...slug]]/WrapTokenMarketData.js';
import { Comeback } from '@/components/Comeback.js';
import { SourceTabs } from '@/components/SourceTabs/index.js';
import { SourceTab } from '@/components/SourceTabs/SourceTab.js';
import { TokenContextProvider } from '@/components/Token/TokenContext.js';
import { SwapButton } from '@/components/TokenProfile/SwapButton.js';
import { TokenCategory } from '@/constants/enum.js';
import { NON_SOL_ETH_COINS } from '@/constants/index.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { getTokenFromCoinGecko } from '@/services/getTokenFromCoinGecko.js';
import { searchTokenByAddress } from '@/services/searchTokenByAddress.js';
import type { NextPageProps } from '@/types/index.js';

export interface TokenPageSearch {
    wallet: string;
    chainId?: string;
    /** if is coingecko coin id, which is more specific */
    isCoinId?: 'true';
    /** trader wallet address */
    trader?: string;
    /** to keep consistent with previous entry */
    traderName?: string;
    address?: string;
}

interface Props
    extends NextPageProps<
        {
            symbol: string;
            slug: [category: string] | undefined;
        },
        TokenPageSearch
    > {}

const categoryUrlPatternMap: Record<TokenCategory, string> = {
    [TokenCategory.Feeds]: `/token/:symbol/feeds`,
    [TokenCategory.Overview]: '/token/:symbol/overview',
    [TokenCategory.Transactions]: `/token/:symbol/transactions`,
};
function resolveCategoryUrl(category: TokenCategory, params: TokenPageSearch & { symbol: string }): string {
    return urlcat(categoryUrlPatternMap[category], params);
}

const TOKEN_CATEGORIES: TokenCategory[] = [TokenCategory.Transactions, TokenCategory.Feeds, TokenCategory.Overview];
export default async function TokenPageLayout(props: PropsWithChildren<Props>) {
    await setupLocaleForSSR();

    const { children } = props;
    const params = await props.params;
    const search = await props.searchParams;
    const paramSymbol = decodeURIComponent(params.symbol);
    let symbol = paramSymbol;
    if (isValidAddressEthereum(paramSymbol)) {
        const token = await searchTokenByAddress(paramSymbol);
        if (token) {
            symbol = token.attributes.symbol;
        }
    }
    const token = await runInSafeAsync(() => getTokenFromCoinGecko(symbol));

    const labels: Record<TokenCategory, React.ReactNode> = {
        [TokenCategory.Transactions]: <Trans>Transactions</Trans>,
        [TokenCategory.Feeds]: <Trans>Feeds</Trans>,
        [TokenCategory.Overview]: <Trans>Overview</Trans>,
    };

    if (!token) {
        notFound();
    }
    const categories = NON_SOL_ETH_COINS.includes(token.id)
        ? [TokenCategory.Feeds, TokenCategory.Overview]
        : TOKEN_CATEGORIES;
    const slug = params.slug?.[0];
    const category = slug && categories.includes(slug as TokenCategory) ? slug : categories[0];

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
                <SourceTabs className="!z-20 md:!top-[57px]">
                    {categories.map((x) => (
                        <SourceTab
                            className="whitespace-nowrap text-base md:!h-[45px] md:!px-4 md:!py-[10px]"
                            key={x}
                            href={resolveCategoryUrl(x, { ...search, symbol })}
                            isActive={x === category}
                        >
                            {labels[x]}
                        </SourceTab>
                    ))}
                </SourceTabs>
            </div>
            <div className="p-3">{children}</div>
        </TokenContextProvider>
    );
}
