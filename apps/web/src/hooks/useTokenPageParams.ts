import { EMPTY_LIST } from '@dimensiondev/constants';
import { TOKEN_CATEGORIES } from '@dimensiondev/constants/computed';
import { COINGECKO_SOL_COIN_ID, NO_TRACING_COINS } from '@dimensiondev/constants/static';
import { TokenCategory } from '@dimensiondev/enums';
import { isTrackedChain, solana } from '@dimensiondev/web3/chains';
import { ETH_NATIVE_TOKEN_ADDRESS, SOL_NATIVE_TOKEN_ADDRESS } from '@dimensiondev/web3/constants';
import { isValidAddress, isValidAddressEthereum, isValidAddressSolana } from '@dimensiondev/web3/utils';
import { compact, first, sortBy } from 'lodash-es';
import { use } from 'react';

import type { TokenPageProps, TokenPageSearch } from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/types.js';
import { resolveCoinGeckoCoinChainId } from '@/helpers/resolveCoingeckoCoinChainId.js';
import { useCoinTrending } from '@/hooks/useCoinTrending.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useTokenInfo } from '@/hooks/useTokenInfo.js';

function isThenable<T>(value: T | Promise<T>): value is Promise<T> {
    return value instanceof Promise;
}

interface TokenPageParamsInput {
    /** Next RSC passes a (React-instrumented) promise; the SSR library's
        routes pass plain values — a promise created during render suspends
        forever on mount retry (React #482). */
    params: TokenPageProps['params'] | Awaited<TokenPageProps['params']>;
    searchParams: TokenPageSearch | Promise<TokenPageSearch>;
}

export function useTokenPageParams({ params, searchParams }: TokenPageParamsInput) {
    // `use` is the one hook allowed in conditionals; plain values skip it.
    const { exchange, slug = EMPTY_LIST } = isThenable(params) ? use(params) : params;
    const isMedium = useIsMedium();

    const isCex = exchange === 'cex';
    const isDex = exchange === 'dex';
    const {
        chainId: paramChainId,
        trader,
        traderName,
        address: paramAddress,
        category: current,
    } = isThenable(searchParams) ? use(searchParams) : searchParams;
    const addressSlug = slug[1];
    const chainIdSlug = isDex ? +slug[0] : undefined;
    const isSolAddress = isValidAddressSolana(addressSlug);
    const isAddress = isValidAddressEthereum(addressSlug) || isSolAddress;

    const chainId = paramChainId ? +paramChainId : isSolAddress ? solana.id : chainIdSlug;
    const { data: token, isPending: isTokenPending } = useTokenInfo({
        token_symbol: isAddress ? undefined : slug[1],
        coingecko_id: isCex ? slug[0] : undefined,
        chain_id: chainId,
        address: paramAddress || (isAddress ? addressSlug : undefined),
    });
    const tokenId = token?.id;
    const coinChainId = tokenId ? resolveCoinGeckoCoinChainId(tokenId) : undefined;
    const { data: trending, isLoading } = useCoinTrending(tokenId);
    const firstContract = first(sortBy(trending?.contracts, (x) => (isValidAddress(x.address) ? 0 : 1)));

    const address =
        paramAddress ?? (isAddress ? addressSlug : coinChainId ? undefined : firstContract?.address) ?? token?.address;
    const tokenAddress =
        tokenId === COINGECKO_SOL_COIN_ID ? SOL_NATIVE_TOKEN_ADDRESS : address || ETH_NATIVE_TOKEN_ADDRESS;

    const updatedChainId =
        token?.chainId ?? chainId ?? trending?.coin.chainId ?? (coinChainId ? coinChainId : firstContract?.chainId);
    const isTracingChain = updatedChainId ? isTrackedChain(updatedChainId) : true;
    const isTracingPlatform = Array.isArray(token?.platform_info)
        ? token.platform_info.some((x) => isTrackedChain(x.chain_id))
        : true;
    const categories = compact([
        ...(tokenId && (NO_TRACING_COINS.includes(tokenId) || !isTracingChain || !isTracingPlatform)
            ? [TokenCategory.Feeds]
            : TOKEN_CATEGORIES),
        isMedium ? null : TokenCategory.About,
    ]);

    const category = current && categories.includes(current as TokenCategory) ? current : categories[0];

    return {
        addressSlug,
        category,
        coinChainId,
        isCex,
        isDex,
        isPending: isLoading,
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
