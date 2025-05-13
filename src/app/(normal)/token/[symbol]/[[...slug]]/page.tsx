'use client';
import { use } from 'react';

import { Feeds } from '@/app/(normal)/token/[symbol]/[[...slug]]/categories/Feeds.js';
import { TokenOverview } from '@/app/(normal)/token/[symbol]/[[...slug]]/categories/TokenOverview.js';
import { Transactions } from '@/app/(normal)/token/[symbol]/[[...slug]]/categories/Transactions.js';
import type { TokenPageSearch } from '@/app/(normal)/token/[symbol]/[[...slug]]/layout.js';
import { TokenCategory } from '@/constants/enum.js';
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
    const { symbol, slug } = use(params);
    const { chainId, isCoinId, trader, traderName, address } = use(searchParams);
    const category = slug?.[0];
    const { data: token } = useTokenInfo(symbol, isCoinId === 'true');
    const { data: trending } = useCoinTrending(token?.id);

    const tokenAddress = address ?? (isValidAddressEthereum(symbol) ? symbol : trending?.contracts?.[0]?.address);

    switch (category) {
        case TokenCategory.Feeds:
            return <Feeds address={tokenAddress} symbol={symbol} />;
        case TokenCategory.Overview:
            return <TokenOverview trending={trending} />;
        case TokenCategory.Transactions:
        default:
            return (
                <Transactions
                    chainId={chainId ? +chainId : (trending?.coin.chainId ?? trending?.contracts?.[0]?.chainId)}
                    tokenAddress={tokenAddress}
                    trader={trader}
                    traderName={traderName}
                />
            );
    }
}
