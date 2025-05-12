'use client';
import { use } from 'react';

import { Activities } from '@/app/(normal)/token/[symbol]/[[...slug]]/categories/Activities.js';
import { Feeds } from '@/app/(normal)/token/[symbol]/[[...slug]]/categories/Feeds.js';
import { TokenOverview } from '@/app/(normal)/token/[symbol]/[[...slug]]/categories/TokenOverview.js';
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
    const { chainId, isCoinId, trader, traderName } = use(searchParams);
    const category = slug?.[0];
    const { data: token } = useTokenInfo(symbol, isCoinId === 'true');
    const { data: trending } = useCoinTrending(token?.id);

    const tokenAddress = isValidAddressEthereum(symbol) ? symbol : trending?.contracts?.[0]?.address;

    switch (category) {
        case TokenCategory.Feeds:
            return <Feeds address={tokenAddress} symbol={symbol} />;
        case TokenCategory.Overview:
            return <TokenOverview trending={trending} />;
        case TokenCategory.Activities:
        default:
            return (
                <Activities
                    chainId={chainId ? +chainId : undefined}
                    tokenAddress={tokenAddress}
                    trader={trader}
                    traderName={traderName}
                />
            );
    }
}
