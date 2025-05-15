'use client';
import { use } from 'react';

import { Feeds } from '@/app/(normal)/token/[symbol]/[[...slug]]/categories/Feeds.js';
import { TokenOverview } from '@/app/(normal)/token/[symbol]/[[...slug]]/categories/TokenOverview.js';
import { Transactions } from '@/app/(normal)/token/[symbol]/[[...slug]]/categories/Transactions.js';
import type { TokenPageSearch } from '@/app/(normal)/token/[symbol]/[[...slug]]/CategoryTabs.js';
import { Loading } from '@/components/Loading.js';
import { TokenCategory } from '@/constants/enum.js';
import {
    COINGECKO_SOL_COIN_ID,
    NON_SOL_ETH_COINS,
    SWAP_SOL_NATIVE_ADDRESS,
    TOKEN_CATEGORIES,
} from '@/constants/index.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { useCoinTrending } from '@/hooks/useCoinTrending.js';
import { useTokenInfo } from '@/hooks/useTokenInfo.js';
import type { NextPageProps } from '@/types/index.js';

interface Props
    extends NextPageProps<
        {
            symbol: string;
            slug: [category: string] | undefined;
        },
        TokenPageSearch
    > {}

export default function TokenCategoryPage({ params, searchParams }: Props) {
    const { symbol, slug: slugs } = use(params);
    const { chainId, isCoinId, trader, traderName, address } = use(searchParams);
    const { data: token } = useTokenInfo(symbol, isCoinId === 'true');

    const categories =
        token?.id && NON_SOL_ETH_COINS.includes(token?.id)
            ? [TokenCategory.Feeds, TokenCategory.Overview]
            : TOKEN_CATEGORIES;

    const slug = slugs?.[0];
    const category = slug && categories.includes(slug as TokenCategory) ? slug : categories[0];
    const { data: trending, isLoading } = useCoinTrending(token?.id);

    const tokenAddress = address ?? (isValidAddressEthereum(symbol) ? symbol : trending?.contracts?.[0]?.address);

    switch (category) {
        case TokenCategory.Feeds:
            return <Feeds address={tokenAddress} symbol={symbol} />;
        case TokenCategory.Overview:
            return <TokenOverview trending={trending} />;
        case TokenCategory.Transactions:
        default:
            if (isLoading && !tokenAddress) return <Loading />;
            return (
                <Transactions
                    chainId={chainId ? +chainId : (trending?.coin.chainId ?? trending?.contracts?.[0]?.chainId)}
                    tokenAddress={token?.id === COINGECKO_SOL_COIN_ID ? SWAP_SOL_NATIVE_ADDRESS : tokenAddress}
                    trader={trader}
                    traderName={traderName}
                />
            );
    }
}
