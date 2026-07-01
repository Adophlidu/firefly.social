import SwapLoadingIcon from '@dimensiondev/assets/swap-loading.svg';
import { isGreaterThan, isLessThan, minus } from '@dimensiondev/web3/numbers';
import { Trans } from '@lingui/react/macro';
import { useAtomValue } from 'jotai';
import { memo, type ReactNode, useMemo } from 'react';

import { ActionButton } from '@/components/ActionButton.js';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.js';
import { useNativeTokenGasReserve } from '@/hooks/swap/useNativeTokenGasReserve.js';
import { useResolvedSwapTokens } from '@/hooks/swap/useResolvedSwapTokens.js';
import { useSwapQuote } from '@/hooks/swap/useSwapQuote.js';
import { useSwapContextWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { useIsSwapBlocked } from '@/hooks/useGeoblock.js';
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
    const { gasReserve } = useNativeTokenGasReserve(fromToken, resolvedFromChain);
    const { isBlocked: isSwapBlocked } = useIsSwapBlocked();

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
    const isInsufficientGas = useMemo(() => {
        if (!fromToken || !fromAmount || gasReserve === null || !fromBalance) return false;
        const remaining = minus(fromBalance, fromAmount);
        return isLessThan(remaining, gasReserve);
    }, [fromToken, fromAmount, fromBalance, gasReserve]);

    const buttonState = useMemo<{ label: ReactNode; disabled: boolean; isLoading?: boolean }>(() => {
        const actionLabel = isCrossChain ? <Trans>Bridge</Trans> : <Trans>Swap</Trans>;

        if (isSwapBlocked) {
            return {
                label: <Trans>Restricted Region</Trans>,
                disabled: true,
            };
        }

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

        if (!fromAmount || Number.parseFloat(fromAmount) === 0) {
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
        isSwapBlocked,
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

    if (isSwapBlocked) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <ActionButton
                        type="button"
                        className="box-border h-14 w-full shrink-0 grow-0 rounded-[48px] text-base font-bold leading-[32px] transition-opacity"
                        disabled
                    >
                        <Trans>Restricted Region</Trans>
                    </ActionButton>
                </TooltipTrigger>
                <TooltipContent>
                    <Trans>This feature is currently unavailable in your region.</Trans>
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <ActionButton
            type="button"
            className="box-border h-14 w-full shrink-0 grow-0 rounded-[48px] text-base font-bold leading-[32px] transition-opacity"
            onClick={onClick}
            disabled={isDisabled}
        >
            {buttonState.label}
        </ActionButton>
    );
});
