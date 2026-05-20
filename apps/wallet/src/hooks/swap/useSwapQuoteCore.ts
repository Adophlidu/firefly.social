import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useDebouncedValue } from '@/hooks/useDebouncedValue.js';
import { createSwapEndpoint } from '@/providers/swap/swapEndpoint.js';
import type { SwapToken } from '@/providers/swap/types.js';
import { getSlippagePercent, type SlippageValue } from '@/store/swap/swapSettings.js';

interface UseSwapExecuteCoreParams {
    enabled?: boolean;
    refetchInterval?: number;
    fromToken: SwapToken | null;
    toToken: SwapToken | null;
    fromChainId: number | null;
    toChainId: number;
    fromAmount: string;
    slippage: SlippageValue;
    walletAddress: string | null;
    recipientAddress: string | null;
}

export function useSwapQuoteCore({
    enabled = true,
    refetchInterval = 10_000,
    fromToken,
    toToken,
    fromChainId,
    toChainId,
    fromAmount,
    slippage,
    walletAddress,
    recipientAddress,
}: UseSwapExecuteCoreParams) {
    // Debounce amount input (300ms)
    const debouncedAmount = useDebouncedValue(fromAmount, 300);

    const slippagePercent = getSlippagePercent(slippage);
    const isCrossChain = !!fromChainId && fromChainId !== toChainId;

    const shouldFetch =
        enabled &&
        !!fromToken &&
        !!toToken &&
        !!debouncedAmount &&
        Number.parseFloat(debouncedAmount) > 0 &&
        !!walletAddress &&
        fromChainId !== null;

    // Fetch same-chain swap quote
    const {
        data: swapQuote,
        isLoading: isLoadingSwap,
        isFetching: isFetchingSwap,
        error: swapError,
        refetch: refetchSwap,
    } = useQuery({
        queryKey: [
            'swap-quote',
            fromToken?.address,
            toToken?.address,
            debouncedAmount,
            fromChainId,
            slippagePercent,
            walletAddress,
        ],
        queryFn: async () => {
            if (!fromToken || !toToken || !debouncedAmount || !walletAddress || !fromChainId) return null;

            const endpoint = createSwapEndpoint();
            return endpoint.getSwapQuote({
                fromTokenAddress: fromToken.address,
                toTokenAddress: toToken.address,
                amount: debouncedAmount,
                fromChainId,
                fromDecimals: fromToken.decimals,
                slippage: slippagePercent.toString(),
                userWalletAddress: walletAddress,
            });
        },
        enabled: shouldFetch && !isCrossChain,
        staleTime: 10_000, // 10 seconds
        refetchInterval: shouldFetch && !isCrossChain ? refetchInterval : false,
        retry: 1,
    });

    // Fetch cross-chain bridge quote
    const {
        data: bridgeQuote,
        isLoading: isLoadingBridge,
        isFetching: isFetchingBridge,
        error: bridgeError,
        refetch: refetchBridge,
    } = useQuery({
        queryKey: [
            'bridge-quote',
            fromToken?.address,
            toToken?.address,
            debouncedAmount,
            fromChainId,
            toChainId,
            slippagePercent,
            walletAddress,
        ],
        queryFn: async () => {
            if (!fromToken || !toToken || !debouncedAmount || !walletAddress || !toChainId || !fromChainId) return null;

            const endpoint = createSwapEndpoint();
            return endpoint.getCrossChainQuote({
                fromTokenAddress: fromToken.address,
                toTokenAddress: toToken.address,
                amount: debouncedAmount,
                fromChainId,
                toChainId,
                fromDecimals: fromToken.decimals,
                slippage: slippagePercent.toString(),
                userWalletAddress: walletAddress,
                recipientWalletAddress: recipientAddress ?? undefined,
            });
        },
        enabled: shouldFetch && isCrossChain,
        staleTime: 10_000, // 10 seconds
        refetchInterval: shouldFetch && isCrossChain ? refetchInterval : false,
        retry: 1,
    });

    const quote = isCrossChain ? bridgeQuote : swapQuote;
    const isLoading = isCrossChain ? isLoadingBridge : isLoadingSwap;
    const isFetching = isCrossChain ? isFetchingBridge : isFetchingSwap;
    const error = isCrossChain ? bridgeError : swapError;

    // Track when quote is pending (debouncing or loading)
    // Handles the case where queries are disabled during debounce period
    const isPending = useMemo(() => {
        // Not pending if no amount entered
        if (!fromAmount || Number.parseFloat(fromAmount) === 0) return false;
        // Pending while debouncing (amount changed but not yet propagated)
        // OR when the active query is loading
        return fromAmount !== debouncedAmount || isLoading;
    }, [fromAmount, debouncedAmount, isLoading]);

    // Extract quote details
    const rate = useMemo(() => {
        if (!quote || !fromAmount || Number.parseFloat(fromAmount) === 0) return null;
        return Number.parseFloat(quote.toAmount) / Number.parseFloat(fromAmount);
    }, [quote, fromAmount]);

    const minReceived = quote?.minReceived ?? null;
    const priceImpact = quote && 'priceImpact' in quote ? (quote.priceImpact ?? null) : null;
    const gasUsd = quote && 'gasUsd' in quote ? (quote.gasUsd ?? null) : null;

    return {
        quote,
        isLoading,
        isFetching,
        isPending,
        error: error?.message ?? null,
        refetch: () => {
            if (isCrossChain) {
                refetchBridge();
            } else {
                refetchSwap();
            }
        },
        rate,
        minReceived,
        priceImpact,
        gasUsd,
    };
}
