import { isSolanaChain } from '@dimensiondev/web3/chains';
import { useQuery } from '@tanstack/react-query';
import { orderBy } from 'lodash-es';
import { useMemo } from 'react';

import { SUPPORTED_SWAP_EVM_CHAIN_IDS } from '@/constants/ethereum.js';
import { useSwapContextWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { normalizeSwapToken } from '@/providers/swap/normalizeSwapToken.js';
import type { RecentToken, SupportedChain, SwapToken } from '@/providers/swap/types.js';
import { getSwapEndpoint } from '@/store/swapEndpoint.js';

const SUPPORTED_SWAP_TRENDING_CHAIN_IDS = [...SUPPORTED_SWAP_EVM_CHAIN_IDS, 101] as const;

export interface UseSwapTokensOptions {
    chainId?: number;
    enabled?: boolean;
    /** Optional wallet address override */
    selectedWalletAddress?: string | null;
    /** Current chain ID (pay/receive side) to determine address type */
    currentChainId?: number | null;
    /** Optionally hide trending tokens (e.g. for Bet Deposit flow) */
    hideTrending?: boolean;
    hideRecent?: boolean;
    supportedChains?: SupportedChain[];
}

export interface SwapTokensResult {
    myTokens: SwapToken[];
    recentTokens: SwapToken[];
    trendingTokens: SwapToken[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

// Convert RecentToken to SwapToken format (backend returns snake_case fields)
function recentTokenToSwapToken(token: RecentToken): SwapToken {
    return normalizeSwapToken({
        address: token.address ?? '',
        symbol: token.symbol ?? '',
        name: token.name,
        decimals: token.decimal,
        chainId: token.chain_id,
        logoURI: token.logo,
        price: token.price ? Number.parseFloat(token.price) : undefined,
    });
}

export function useSwapTokens(options: UseSwapTokensOptions = {}): SwapTokensResult {
    const {
        chainId,
        enabled = true,
        selectedWalletAddress,
        currentChainId,
        hideTrending,
        hideRecent,
        supportedChains,
    } = options;
    const {
        evmAddress: cachedEvmAddress,
        solanaAddress: cachedSolanaAddress,
        isPrivyReady,
    } = useSwapContextWalletAddresses();

    // Determine which addresses to use based on wallet filter selection
    // Priority: selectedWalletAddress > cached addresses
    let evmAddress: string | null;
    let solanaAddress: string | null;

    if (selectedWalletAddress) {
        // If a specific wallet is selected, determine if it's EVM or Solana
        if (isSolanaChain(currentChainId)) {
            evmAddress = cachedEvmAddress;
            solanaAddress = selectedWalletAddress;
        } else {
            evmAddress = selectedWalletAddress;
            solanaAddress = cachedSolanaAddress;
        }
    } else {
        // No wallet selected - use cached embedded wallet addresses
        evmAddress = cachedEvmAddress;
        solanaAddress = cachedSolanaAddress;
    }

    const supportedChainIds = supportedChains?.map((chain) => chain.chainId) || [];

    // Fetch user token balances
    // Note: EVM and Solana addresses must be queried separately due to API format requirements
    const {
        data: userTokensData,
        isLoading: isLoadingUserTokens,
        refetch: refetchUserTokens,
    } = useQuery({
        queryKey: ['swap-user-tokens', evmAddress, solanaAddress, chainId, supportedChainIds],
        queryFn: async () => {
            if (!supportedChainIds.length) return [];

            const endpoint = getSwapEndpoint();

            // EVM chains supported by the swap API.
            // Solana chain: 101
            const swapEvmChains = supportedChainIds.filter((chainId) => !isSolanaChain(chainId));
            const isSolanaSupported = supportedChainIds.some((chainId) => isSolanaChain(chainId)) ?? false;
            const evmChains = chainId ? (isSolanaChain(chainId) ? [] : [chainId]) : [...swapEvmChains];
            const solanaChains = chainId ? (isSolanaChain(chainId) ? [chainId] : []) : isSolanaSupported ? [101] : [];

            // Query EVM and Solana balances in parallel
            const [evmTokens, solanaTokens] = await Promise.all([
                evmAddress && evmChains.length > 0 ? endpoint.getUserTokenBalances(evmAddress, evmChains) : [],
                solanaAddress && solanaChains.length > 0
                    ? endpoint.getUserTokenBalances(solanaAddress, solanaChains)
                    : [],
            ]);

            return [...evmTokens, ...solanaTokens];
        },
        enabled: enabled && isPrivyReady && !!(evmAddress || solanaAddress),
        staleTime: 30 * 1000, // 30 seconds
    });

    // Fetch recent tokens
    const {
        data: recentTokensData,
        isLoading: isLoadingRecentTokens,
        refetch: refetchRecentTokens,
    } = useQuery({
        queryKey: ['swap-recent-tokens', chainId],
        queryFn: async () => {
            const endpoint = getSwapEndpoint();
            // Use chains filter if chainId is provided
            return endpoint.getRecentTokens({
                chains: chainId ? String(chainId) : undefined,
                size: 20,
            });
        },
        enabled: enabled && !hideRecent,
        staleTime: 60 * 1000, // 1 minute
    });

    // Fetch trending tokens
    const {
        data: trendingTokensData,
        isLoading: isLoadingTrendingTokens,
        refetch: refetchTrendingTokens,
    } = useQuery({
        queryKey: ['swap-trending-tokens', chainId, supportedChainIds],
        queryFn: async () => {
            const chains = !supportedChainIds.length
                ? null
                : chainId
                  ? supportedChainIds.includes(chainId)
                      ? String(chainId)
                      : null
                  : SUPPORTED_SWAP_TRENDING_CHAIN_IDS.filter((id) => supportedChainIds.includes(id)).join(',');
            if (!chains) return [];

            const endpoint = getSwapEndpoint();
            // chains is required — pass specific chain or all major chains
            return endpoint.getTrendingTokens({
                chains,
            });
        },
        enabled: enabled && !hideTrending,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const isLoading = isLoadingUserTokens || isLoadingRecentTokens || isLoadingTrendingTokens;

    const result = useMemo(() => {
        // Create a map of user balances by token address + chain
        const userBalanceMap = new Map<string, string>();
        const userUsdValueMap = new Map<string, number>();

        for (const token of userTokensData ?? []) {
            const key = `${token.chainId}:${token.address.toLowerCase()}`;
            if (token.balance) {
                userBalanceMap.set(key, token.balance);
            }
            const usdValue =
                token.usdValue ??
                (token.balance && token.price ? Number.parseFloat(token.balance) * token.price : undefined);
            if (usdValue !== undefined) {
                userUsdValueMap.set(key, usdValue);
            }
        }

        // My tokens: directly from user balance API
        const myTokens = orderBy(
            (userTokensData ?? [])
                .filter((t) => t.balance && Number.parseFloat(t.balance) > 0)
                .map((t) => {
                    const usdValue =
                        t.usdValue ?? (t.balance && t.price ? Number.parseFloat(t.balance) * t.price : undefined);
                    return { ...t, usdValue };
                }),
            [(t) => t.usdValue ?? 0],
            ['desc'],
        );

        // Recent tokens: convert from RecentToken format and enrich with balances
        const recentTokens = (recentTokensData ?? [])
            .map((token) => {
                const swapToken = recentTokenToSwapToken(token);
                return {
                    ...swapToken,
                    balance: userBalanceMap.get(`${token.chain_id}:${(token.address ?? '').toLowerCase()}`),
                    usdValue: userUsdValueMap.get(`${token.chain_id}:${(token.address ?? '').toLowerCase()}`),
                };
            })
            .slice(0, 10); // Limit to 10 recent tokens

        // Trending tokens: from recommend-tokens API, enriched with balances
        const trendingTokens = Array.isArray(trendingTokensData)
            ? trendingTokensData.map((token) => ({
                  ...token,
                  balance: userBalanceMap.get(`${token.chainId}:${token.address.toLowerCase()}`),
                  usdValue: userUsdValueMap.get(`${token.chainId}:${token.address.toLowerCase()}`),
              }))
            : [];

        return {
            myTokens,
            recentTokens,
            trendingTokens,
        };
    }, [userTokensData, recentTokensData, trendingTokensData]);

    return {
        ...result,
        isLoading,
        error: null,
        refetch: () => {
            refetchUserTokens();
            refetchRecentTokens();
            refetchTrendingTokens();
        },
    };
}

// Hook to search tokens
export function useSearchTokens(keyword: string, chain?: string) {
    return useQuery({
        queryKey: ['swap-search-tokens', keyword, chain],
        queryFn: async () => {
            if (!keyword || keyword.length < 2) return [];

            const endpoint = getSwapEndpoint();
            return endpoint.searchToken({ keyword, chain });
        },
        enabled: keyword.length >= 2,
        staleTime: 60 * 1000, // 1 minute
    });
}
