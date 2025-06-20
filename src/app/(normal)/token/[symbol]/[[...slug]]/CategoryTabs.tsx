'use client';
import { Trans } from '@lingui/react/macro';
import { isArray } from 'lodash-es';
import { ReadonlyURLSearchParams, useParams, useSearchParams } from 'next/navigation.js';
import { type HTMLProps, memo } from 'react';
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
}
interface Props extends HTMLProps<HTMLDivElement> {
    slug?: string;
    token: CoinGeckoToken;
}

const labels: Record<TokenCategory, React.ReactNode> = {
    [TokenCategory.Transactions]: <Trans>Transactions</Trans>,
    [TokenCategory.Feeds]: <Trans>Feeds</Trans>,
    [TokenCategory.Overview]: <Trans>Overview</Trans>,
};

const categoryUrlPatternMap: Record<TokenCategory, string> = {
    [TokenCategory.Feeds]: `/token/:symbol/feeds`,
    [TokenCategory.Overview]: '/token/:symbol/overview',
    [TokenCategory.Transactions]: `/token/:symbol/transactions`,
};

function resolveTab(category: TokenCategory, params: ReadonlyURLSearchParams, symbol: string) {
    return urlcat(categoryUrlPatternMap[category], { ...Object.fromEntries(params.entries()), symbol });
}
export const CategoryTabs = memo<Props>(function CategoryTabs({ slug, token, ...rest }) {
    const { symbol } = useParams<{ symbol: string }>();
    const search = useSearchParams();

    const tokenId = token.id;
    const isTracingChain = token?.chainId ? TRACING_CHAINS.includes(token.chainId) : true;
    const isTracingPlatform = isArray(token?.platform_info)
        ? token.platform_info.some((x) => TRACING_CHAINS.includes(x.chain_id))
        : true;

    const categories =
        tokenId && (NO_TRACING_COINS.includes(tokenId) || !isTracingChain || !isTracingPlatform)
            ? [TokenCategory.Feeds, TokenCategory.Overview]
            : TOKEN_CATEGORIES;
    const category = slug && categories.includes(slug as TokenCategory) ? slug : categories[0];

    return (
        <SourceTabs {...rest}>
            {categories.map((x) => (
                <SourceTab
                    className="whitespace-nowrap text-base md:!h-[45px] md:!px-4 md:!py-[10px]"
                    key={x}
                    href={resolveTab(x, search, symbol)}
                    isActive={x === category}
                >
                    {labels[x]}
                </SourceTab>
            ))}
        </SourceTabs>
    );
});
