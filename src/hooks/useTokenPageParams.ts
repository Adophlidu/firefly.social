import { first, sortBy } from 'lodash-es';
import { use } from 'react';

import type { TokenPageProps } from '@/app/(normal)/token/[exchange]/[[...slug]]/types.js';
import { TokenCategory } from '@/constants/enum.js';
import {
    COINGECKO_SOL_COIN_ID,
    EMPTY_LIST,
    NO_TRACING_COINS,
    SWAP_SOL_NATIVE_ADDRESS,
    TOKEN_CATEGORIES,
    TRACING_CHAINS,
} from '@/constants/index.js';
import { isValidAddress, isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';
import { resolveCoinGeckoCoinChainId } from '@/helpers/resolveCoingeckoCoinChainId.js';
import { useCoinTrending } from '@/hooks/useCoinTrending.js';
import { useTokenInfo } from '@/hooks/useTokenInfo.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export function useTokenPageParams({ params, searchParams }: TokenPageProps) {
    const { exchange, slug = EMPTY_LIST } = use(params);
    const isCex = exchange === 'cex';
    const isDex = exchange === 'dex';
    const { chainId: paramChainId, trader, traderName, address: paramAddress, category: current } = use(searchParams);
    const addressSlug = slug[1];
    const chainIdSlug = isDex ? +slug[0] : undefined;
    const isSolAddress = isValidAddressSolana(addressSlug);
    const isAddress = isValidAddressEthereum(addressSlug) || isSolAddress;

    const chainId = paramChainId ? +paramChainId : isSolAddress ? SolanaChainId.Mainnet : chainIdSlug;
    const { data: token, isPending: isTokenPending } = useTokenInfo({
        token_symbol: isAddress ? undefined : exchange,
        coingecko_id: isCex ? slug[0] : undefined,
        chain_id: chainId,
        address: paramAddress || (isAddress ? exchange : undefined),
    });
    const tokenId = token?.id;
    const coinChainId = tokenId ? resolveCoinGeckoCoinChainId(tokenId) : undefined;
    const { data: trending, isPending } = useCoinTrending(tokenId);
    const firstContract = first(sortBy(trending?.contracts, (x) => (isValidAddress(x.address) ? 0 : 1)));

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
            ? [TokenCategory.Feeds]
            : TOKEN_CATEGORIES;

    const category = current && categories.includes(current as TokenCategory) ? current : categories[0];

    return {
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
    };
}
