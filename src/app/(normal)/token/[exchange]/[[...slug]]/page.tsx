'use client';

import { use } from 'react';

import { Feeds } from '@/app/(normal)/token/[exchange]/[[...slug]]/categories/Feeds.js';
import { Overview } from '@/app/(normal)/token/[exchange]/[[...slug]]/categories/Overview.js';
import { Transactions } from '@/app/(normal)/token/[exchange]/[[...slug]]/categories/Transactions.js';
import type { TokenPageSearch } from '@/app/(normal)/token/[exchange]/[[...slug]]/CategoryTabs.js';
import TokenPageLoading from '@/app/(normal)/token/[exchange]/[[...slug]]/loading.js';
import { TokenCategory } from '@/constants/enum.js';
import {
    COINGECKO_SOL_COIN_ID,
    NO_TRACING_COINS,
    SWAP_SOL_NATIVE_ADDRESS,
    TOKEN_CATEGORIES,
    TRACING_CHAINS,
} from '@/constants/index.js';
import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';
import { resolveCoinGeckoCoinChainId } from '@/helpers/resolveCoingeckoCoinChainId.js';
import { useCoinTrending } from '@/hooks/useCoinTrending.js';
import { useTokenInfo } from '@/hooks/useTokenInfo.js';
import type { NextPageProps } from '@/types/utility.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

interface Props
    extends NextPageProps<
        {
            exchange: string;
            slug: [coingecko_id: string] | [chain_id: string, address: string];
        },
        TokenPageSearch
    > {}

export default function TokenCategoryPage({ params, searchParams }: Props) {
    const { exchange, slug } = use(params);
    const isCex = exchange === 'cex';
    const isDex = exchange === 'dex';
    const { chainId: paramChainId, trader, traderName, address: paramAddress, category: current } = use(searchParams);
    const addressSlug = slug[1];
    const isSolAddress = isValidAddressSolana(addressSlug);
    const isAddress = isValidAddressEthereum(addressSlug) || isSolAddress;

    const chainId = paramChainId ? +paramChainId : isSolAddress ? SolanaChainId.Mainnet : undefined;
    const { data: token, isPending: isTokenPending } = useTokenInfo({
        token_symbol: isAddress ? undefined : exchange,
        coingecko_id: isCex ? slug[0] : undefined,
        chain_id: chainId,
        address: paramAddress || (isAddress ? exchange : undefined),
    });
    const tokenId = token?.id;
    const coinChainId = tokenId ? resolveCoinGeckoCoinChainId(tokenId) : undefined;
    const { data: trending, isPending } = useCoinTrending(tokenId);
    const firstContract = trending?.contracts?.[0];

    const address =
        paramAddress ?? (isAddress ? addressSlug : coinChainId ? undefined : firstContract?.address) ?? token?.address;
    const tokenAddress = tokenId === COINGECKO_SOL_COIN_ID ? SWAP_SOL_NATIVE_ADDRESS : address;

    const updatedChainId =
        token?.chainId ?? chainId ?? trending?.coin.chainId ?? (coinChainId ? coinChainId : firstContract?.chainId);
    const isTracingChain = updatedChainId ? TRACING_CHAINS.includes(updatedChainId) : true;
    const isTracingPlatform = Array.isArray(token?.platform_info)
        ? token.platform_info.some((x) => TRACING_CHAINS.includes(x.chain_id))
        : true;
    const categories =
        tokenId && (NO_TRACING_COINS.includes(tokenId) || !isTracingChain || !isTracingPlatform)
            ? [TokenCategory.Feeds, TokenCategory.Overview]
            : TOKEN_CATEGORIES;

    const category = current && categories.includes(current as TokenCategory) ? current : categories[0];

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
        case TokenCategory.Overview:
            if (isTokenPending) return <TokenPageLoading />;
            return <Overview coinId={tokenId} chainId={updatedChainId} address={tokenAddress} />;
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

export const dynamic = 'force-dynamic';
