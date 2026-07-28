'use client';

import { TOKEN_CATEGORIES } from '@dimensiondev/constants/computed';
import { NO_TRACING_COINS } from '@dimensiondev/constants/static';
import { TokenCategory } from '@dimensiondev/enums';
import { isTrackedChain } from '@dimensiondev/web3/chains';
import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { type HTMLProps, memo, type ReactNode } from 'react';
import urlcat from 'urlcat';

import { SourceTabs } from '@/components/SourceTabs/index.js';
import { SourceTab } from '@/components/SourceTabs/SourceTab.js';
import { usePathname, useSearchParams } from '@/esm/navigation.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import type { CoinGeckoToken } from '@/providers/types/CoinGecko.js';

interface Props extends HTMLProps<HTMLDivElement> {
    token: CoinGeckoToken;
}

const labels: Record<TokenCategory, ReactNode> = {
    [TokenCategory.Transactions]: <Trans>Transactions</Trans>,
    [TokenCategory.Feeds]: <Trans>Feeds</Trans>,
    [TokenCategory.About]: <Trans>About</Trans>,
};

function resolveTab(pathname: string, category: TokenCategory, params: URLSearchParams) {
    return urlcat(pathname, { ...Object.fromEntries(params), category });
}

export const CategoryTabs = memo<Props>(function CategoryTabs({ token, ...rest }) {
    const search = useSearchParams();
    const pathname = usePathname();
    const isMedium = useIsMedium();

    const tokenId = token.id;
    const isTracingChain = token?.chainId ? isTrackedChain(token.chainId) : true;
    const isTracingPlatform = Array.isArray(token?.platform_info)
        ? token.platform_info.some((x) => isTrackedChain(x.chain_id))
        : true;

    const categories = compact([
        ...(tokenId && (NO_TRACING_COINS.includes(tokenId) || !isTracingChain || !isTracingPlatform)
            ? [TokenCategory.Feeds]
            : TOKEN_CATEGORIES),
        isMedium ? null : TokenCategory.About,
    ]);
    const current = search.get('category');
    const category = current && categories.includes(current as TokenCategory) ? current : categories[0];

    return (
        <SourceTabs {...rest}>
            {categories.map((x) => (
                <SourceTab
                    className="whitespace-nowrap text-base md:!h-[45px] md:!px-4 md:!py-2.5"
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
