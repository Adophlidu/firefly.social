'use client';

import { TokenCategory } from '@dimensiondev/enums';

import { Feeds } from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/categories/Feeds.js';
import { Transactions } from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/categories/Transactions.js';
import TokenPageLoading from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/loading.js';
import type { TokenPageProps } from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/types.js';
import { TokenOverview } from '@/components/TokenProfile/TokenOverview/index.js';
import { useTokenPageParams } from '@/hooks/useTokenPageParams.js';

export default function TokenCategoryPage(props: TokenPageProps) {
    const {
        addressSlug,
        category,
        coinChainId,
        isCex,
        isDex,
        isPending,
        isTokenPending,
        slug,
        token,
        tokenAddress,
        tokenId,
        trader,
        traderName,
        updatedChainId,
    } = useTokenPageParams(props);

    switch (category) {
        case TokenCategory.Feeds:
            if (isTokenPending && !tokenAddress) return <TokenPageLoading />;
            return (
                <Feeds
                    chainId={updatedChainId}
                    address={tokenAddress}
                    symbol={token?.symbol || (isCex ? slug[0] : isDex ? addressSlug : undefined) || ''}
                    name={token?.name}
                />
            );
        case TokenCategory.About:
            return <TokenOverview coinId={tokenId} chainId={updatedChainId} address={tokenAddress} className="pb-20" />; // space for floating wallet button
        case TokenCategory.Transactions:
        default:
            if ((isTokenPending || tokenId) && isPending && !tokenAddress) return <TokenPageLoading />;
            // Use explicit chain id for native token to distinguish between evm chains.
            const txChainId = tokenId && !updatedChainId && !tokenAddress ? coinChainId : updatedChainId;
            return (
                <Transactions chainId={txChainId} tokenAddress={tokenAddress} trader={trader} traderName={traderName} />
            );
    }
}
