import SwapLoadingIcon from '@dimensiondev/assets/swap-loading.svg';
import { isNativeTokenAddress } from '@dimensiondev/web3-utils';
import { Trans } from '@lingui/react/macro';
import { useAtomValue } from 'jotai';
import { memo, type ReactNode, useMemo } from 'react';

import { isGreaterThan } from '@/helpers/number.js';
import { useResolvedSwapTokens } from '@/hooks/swap/useResolvedSwapTokens.js';
import { useSwapQuote } from '@/hooks/swap/useSwapQuote.js';
import { useSwapContextWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { cn } from '@/lib/utils.js';
import { fromAmountAtom, isCrossChainAtom } from '@/store/swap/swapState.js';

export interface SwapActionButtonProps {
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    fromBalance?: string;
    isBalanceLoading?: boolean;
}

export const SwapActionButton = memo(function SwapActionButton({
    onClick,
    loading = false,
    disabled = false,
    fromBalance,
    isBalanceLoading = false,
}: SwapActionButtonProps) {
    const { fromToken, toToken, resolvedFromChain } = useResolvedSwapTokens();
    const fromAmount = useAtomValue(fromAmountAtom);
    const isCrossChain = useAtomValue(isCrossChainAtom);
    const { quote, isPending } = useSwapQuote();

    const { evmAddress, solanaAddress, isPrivyReady } = useSwapContextWalletAddresses();

    const hasWallet = useMemo(() => {
        if (resolvedFromChain === 101 || resolvedFromChain === 501) {
            return !!solanaAddress;
        }
        return !!evmAddress;
    }, [resolvedFromChain, evmAddress, solanaAddress]);

    // Show loading state when balance or quote is loading
    const isLoading = isPending || isBalanceLoading || loading;

    const isInsufficientBalance = useMemo(() => {
        // Don't show insufficient balance while balance is still loading
        if (!fromToken || !fromAmount || isBalanceLoading || fromBalance === undefined) return false;
        return isGreaterThan(fromAmount, fromBalance);
    }, [fromToken, fromAmount, fromBalance, isBalanceLoading]);

    // Check for insufficient gas (native token balance for gas fees)
    // This is a simplified check - in production would need to compare gas estimate vs native balance
    const isInsufficientGas = useMemo(() => {
        if (!quote || !('gasEstimate' in quote) || !quote.gasEstimate || !fromToken) return false;
        // For native tokens (ETH, SOL, etc.), check if balance minus swap amount covers gas
        if (isNativeTokenAddress(fromToken.address)) {
            const balanceNum = parseFloat(fromBalance || '0');
            const amountNum = parseFloat(fromAmount || '0');
            const gasEstimate = parseFloat(quote.gasEstimate);
            // Rough estimate: if remaining balance after swap < 10x gas estimate, likely insufficient
            return balanceNum - amountNum < gasEstimate * 0.001;
        }
        return false;
    }, [quote, fromToken, fromAmount, fromBalance]);

    const buttonState = useMemo<{ label: ReactNode; disabled: boolean; isLoading?: boolean }>(() => {
        const actionLabel = isCrossChain ? <Trans>Bridge</Trans> : <Trans>Swap</Trans>;

        if (!isPrivyReady || !hasWallet) {
            return {
                label: <Trans>Connect Wallet</Trans>,
                disabled: false,
            };
        }

        if (!fromToken || !toToken) {
            return {
                label: actionLabel,
                disabled: true,
            };
        }

        if (!fromAmount || parseFloat(fromAmount) === 0) {
            return {
                label: actionLabel,
                disabled: true,
            };
        }

        // Show loading state during quote or balance loading
        if (isLoading) {
            return {
                label: (
                    <span className="flex items-center justify-center gap-2">
                        <SwapLoadingIcon className="size-5 animate-spin" />
                        {actionLabel}
                    </span>
                ),
                disabled: true,
                isLoading: true,
            };
        }

        if (isInsufficientBalance) {
            return {
                label: <Trans>Insufficient Balance</Trans>,
                disabled: true,
            };
        }

        if (isInsufficientGas) {
            return {
                label: <Trans>Insufficient Gas</Trans>,
                disabled: true,
            };
        }

        if (!quote) {
            return {
                label: <Trans>No Route Found</Trans>,
                disabled: true,
            };
        }

        return {
            label: actionLabel,
            disabled: false,
        };
    }, [
        isPrivyReady,
        hasWallet,
        fromToken,
        toToken,
        fromAmount,
        isLoading,
        isInsufficientBalance,
        isInsufficientGas,
        quote,
        isCrossChain,
    ]);

    const isDisabled = disabled || buttonState.disabled || loading;

    return (
        <button
            type="button"
            className={cn(
                'h-12 w-full rounded-[96px] text-[16px] font-bold transition-opacity',
                isDisabled
                    ? 'cursor-not-allowed bg-[#d8d7e1] text-[#a9a6bc]'
                    : 'bg-lightTextMain cursor-pointer text-white hover:opacity-90 active:opacity-80',
            )}
            onClick={onClick}
            disabled={isDisabled}
        >
            {buttonState.label}
        </button>
    );
});
