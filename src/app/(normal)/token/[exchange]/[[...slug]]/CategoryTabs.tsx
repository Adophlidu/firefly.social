'use client';
import { Trans } from '@lingui/react/macro';
import { ReadonlyURLSearchParams, usePathname, useSearchParams } from 'next/navigation.js';
import { type HTMLProps, memo, type ReactNode } from 'react';
import urlcat from 'urlcat';

import { SourceTabs } from '@/components/SourceTabs/index.js';
import { SourceTab } from '@/components/SourceTabs/SourceTab.js';
import { TokenCategory } from '@/constants/enum.js';
import { NO_TRACING_COINS, TOKEN_CATEGORIES, TRACING_CHAINS } from '@/constants/index.js';
import type { CoinGeckoToken } from '@/providers/types/CoinGecko.js';

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
    source?: string;
    category?: TokenCategory;
}
interface Props extends HTMLProps<HTMLDivElement> {
    token: CoinGeckoToken;
}

const labels: Record<TokenCategory, ReactNode> = {
    [TokenCategory.Transactions]: <Trans>Transactions</Trans>,
    [TokenCategory.Feeds]: <Trans>Feeds</Trans>,
    [TokenCategory.Overview]: <Trans>Overview</Trans>,
};

function resolveTab(pathname: string, category: TokenCategory, params: ReadonlyURLSearchParams) {
    return urlcat(pathname, { ...Object.fromEntries(params), category });
}
export const CategoryTabs = memo<Props>(function CategoryTabs({ token, ...rest }) {
    const search = useSearchParams();
    const pathname = usePathname();

    const tokenId = token.id;
    const isTracingChain = token?.chainId ? TRACING_CHAINS.includes(token.chainId) : true;
    const isTracingPlatform = Array.isArray(token?.platform_info)
        ? token.platform_info.some((x) => TRACING_CHAINS.includes(x.chain_id))
        : true;

    const categories =
        tokenId && (NO_TRACING_COINS.includes(tokenId) || !isTracingChain || !isTracingPlatform)
            ? [TokenCategory.Feeds, TokenCategory.Overview]
            : TOKEN_CATEGORIES;
    const current = search.get('category');
    const category = current && categories.includes(current as TokenCategory) ? current : categories[0];

    return (
        <SourceTabs {...rest}>
            {categories.map((x) => (
                <SourceTab
                    className="whitespace-nowrap text-base md:!h-[45px] md:!px-4 md:!py-[10px]"
                    key={x}
                    href={resolveTab(pathname, x, search)}
                    isActive={x === category}
                    replace
                    prefetch={false}
                    shallow
                >
                    {labels[x]}
                </SourceTab>
            ))}
        </SourceTabs>
    );
});
