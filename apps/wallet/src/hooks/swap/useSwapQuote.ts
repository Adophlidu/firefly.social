import { useAtomValue } from 'jotai';

import { useEffectiveSwapWalletAddress } from '@/hooks/swap/useEffectiveSwapWalletAddress.js';
import { useResolvedSwapTokens } from '@/hooks/swap/useResolvedSwapTokens.js';
import { useSwapQuoteCore } from '@/hooks/swap/useSwapQuoteCore.js';
import { useSwapContextWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import type { CrossChainQuote, SwapQuote } from '@/providers/swap/types.js';
import { slippageAtom } from '@/store/swap/swapSettings.js';
import { fromAmountAtom, swapStepAtom } from '@/store/swap/swapState.js';

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

export function useSwapQuote(options: UseSwapQuoteOptions = {}): UseSwapQuoteResult {
    const { enabled = true, refetchInterval = 10_000 } = options;

    const { fromToken, toToken, resolvedFromChain: fromChainId, resolvedToChain: toChainId } = useResolvedSwapTokens();
    const fromAmount = useAtomValue(fromAmountAtom);
    const slippage = useAtomValue(slippageAtom);
    const swapStep = useAtomValue(swapStepAtom);

    const { isPrivyReady } = useSwapContextWalletAddresses();
    const walletAddress = useEffectiveSwapWalletAddress('pay', fromChainId);
    const recipientAddress = useEffectiveSwapWalletAddress('receive', toChainId ?? fromChainId);

    return useSwapQuoteCore({
        fromToken,
        toToken,
        fromChainId,
        toChainId,
        fromAmount,
        slippage,
        walletAddress,
        recipientAddress,
        refetchInterval,
        enabled: enabled && isPrivyReady && swapStep === 'input',
    });
}
