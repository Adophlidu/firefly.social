import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';

import { useEffectiveSwapWalletAddress } from '@/hooks/swap/useEffectiveSwapWalletAddress.js';
import { useResolvedSwapTokens } from '@/hooks/swap/useResolvedSwapTokens.js';
import { useSwapContextWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { createSwapEndpoint } from '@/providers/swap/index.js';
import { type CrossChainQuote, type SwapQuote } from '@/providers/swap/types.js';
import { getSlippagePercent, slippageAtom } from '@/store/swap/swapSettings.js';
import { fromAmountAtom, isCrossChainAtom, swapStepAtom } from '@/store/swap/swapState.js';

export interface UseSwapQuoteOptions {
    enabled?: boolean;
    refetchInterval?: number;
}

export interface UseSwapQuoteResult {
    quote: SwapQuote | CrossChainQuote | null | undefined;
    isLoading: boolean;
    isFetching: boolean;
    isPending: boolean;
    error: string | null;
    refetch: () => void;
    rate: number | null;
    minReceived: string | null;
    priceImpact: string | null;
    gasUsd: number | null;
}

// Debounce helper — delays propagating the value until it has been stable for `delay` ms
function useDebouncedValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

export function useSwapQuote(options: UseSwapQuoteOptions = {}): UseSwapQuoteResult {
    const { enabled = true, refetchInterval = 10_000 } = options;

    const { fromToken, toToken, resolvedFromChain: fromChainId, resolvedToChain: toChainId } = useResolvedSwapTokens();
    const fromAmount = useAtomValue(fromAmountAtom);
    const isCrossChain = useAtomValue(isCrossChainAtom);
    const slippage = useAtomValue(slippageAtom);
    const swapStep = useAtomValue(swapStepAtom);

    const { isPrivyReady } = useSwapContextWalletAddresses();
    const walletAddress = useEffectiveSwapWalletAddress('pay', fromChainId);
    const recipientAddress = useEffectiveSwapWalletAddress('receive', toChainId ?? fromChainId);

    // Debounce amount input (300ms)
    const debouncedAmount = useDebouncedValue(fromAmount, 300);

    // Get slippage percentage
    const slippagePercent = getSlippagePercent(slippage);

    // Check if query should be enabled
    const shouldFetch =
        enabled &&
        isPrivyReady &&
        swapStep === 'input' &&
        !!fromToken &&
        !!toToken &&
        !!debouncedAmount &&
        parseFloat(debouncedAmount) > 0 &&
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
            if (!fromToken || !toToken || !debouncedAmount || !walletAddress) return null;

            const endpoint = createSwapEndpoint();
            return endpoint.getSwapQuote({
                fromTokenAddress: fromToken.address,
                toTokenAddress: toToken.address,
                amount: debouncedAmount,
                fromChainId: fromChainId!,
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
            if (!fromToken || !toToken || !debouncedAmount || !walletAddress || !toChainId) return null;

            const endpoint = createSwapEndpoint();
            return endpoint.getCrossChainQuote({
                fromTokenAddress: fromToken.address,
                toTokenAddress: toToken.address,
                amount: debouncedAmount,
                fromChainId: fromChainId!,
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
        if (!fromAmount || parseFloat(fromAmount) === 0) return false;
        // Pending while debouncing (amount changed but not yet propagated)
        // OR when the active query is loading
        return fromAmount !== debouncedAmount || isLoading;
    }, [fromAmount, debouncedAmount, isLoading]);

    // Extract quote details
    const rate = useMemo(() => {
        if (!quote || !fromAmount || parseFloat(fromAmount) === 0) return null;
        return parseFloat(quote.toAmount) / parseFloat(fromAmount);
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
