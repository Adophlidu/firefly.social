'use client';
import { Trans } from '@lingui/react/macro';
import { useParams, useSearchParams } from 'next/navigation.js';
import { type HTMLProps, memo } from 'react';
import urlcat from 'urlcat';

import { SourceTabs } from '@/components/SourceTabs/index.js';
import { SourceTab } from '@/components/SourceTabs/SourceTab.js';
import { TokenCategory } from '@/constants/enum.js';
import { NON_SOL_ETH_COINS, TOKEN_CATEGORIES } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';

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
interface Props extends HTMLProps<HTMLDivElement> {
    slug?: string;
    tokenId: string | null;
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
function resolveCategoryUrl(category: TokenCategory, params: TokenPageSearch & { symbol: string }): string {
    return urlcat(categoryUrlPatternMap[category], params);
}
export const CategoryTabs = memo<Props>(function CategoryTabs({ slug, tokenId, ...rest }) {
    const { symbol } = useParams<{ symbol: string }>();
    const search = useSearchParams();

    const categories =
        tokenId && NON_SOL_ETH_COINS.includes(tokenId)
            ? [TokenCategory.Feeds, TokenCategory.Overview]
            : TOKEN_CATEGORIES;
    const category = slug && categories.includes(slug as TokenCategory) ? slug : categories[0];

    return (
        <SourceTabs {...rest} className={classNames('!z-20 md:!top-[57px]', rest.className)}>
            {categories.map((x) => (
                <SourceTab
                    className="whitespace-nowrap text-base md:!h-[45px] md:!px-4 md:!py-[10px]"
                    key={x}
                    href={resolveCategoryUrl(x, {
                        wallet: search.get('wallet')!,
                        chainId: search.get('chainId') || undefined,
                        isCoinId: (search.get('isCoinId') as 'true') || undefined,
                        trader: search.get('trader') || undefined,
                        traderName: search.get('traderName') || undefined,
                        address: search.get('address') || undefined,
                        symbol,
                    })}
                    isActive={x === category}
                >
                    {labels[x]}
                </SourceTab>
            ))}
        </SourceTabs>
    );
});
