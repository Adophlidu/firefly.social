import { isSameAddress } from '@dimensiondev/web3/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { useAsyncFn } from 'react-use';

import { buildSwapAnalyticsParams } from '@/helpers/swap/buildSwapAnalyticsParams.js';
import { handleSwapSuccess } from '@/helpers/swap/handleSwapSuccess.js';
import { captureWalletTelemetryEvent, WalletTelemetryEventId } from '@/helpers/swap/swapAnalytics.js';
import { withSkipPinCodeCheck } from '@/helpers/withSkipPinCodeCheck.js';
import { useEffectiveSwapWalletAddress } from '@/hooks/swap/useEffectiveSwapWalletAddress.js';
import { useResolvedSwapTokens } from '@/hooks/swap/useResolvedSwapTokens.js';
import {
    type SwapAnalyticsParams,
    type SwapSuccessParams,
    useSwapExecuteCore,
} from '@/hooks/swap/useSwapExecuteCore.js';
import { useSwapContextWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { usePrivyWallet } from '@/hooks/usePrivyWallet.js';
import { slippageAtom } from '@/store/swap/swapSettings.js';
import { accessPathAtom, fromAmountAtom, swapStepAtom } from '@/store/swap/swapState.js';

export interface UseSwapExecuteResult {
    error: string | null;
    txHash: string | null;
    loading: boolean;
    execute: () => Promise<void>;
}

export function useSwapExecute(): UseSwapExecuteResult {
    const queryClient = useQueryClient();
    const { evmAddress, solanaAddress } = usePrivyWallet();

    const { fromToken, toToken, resolvedFromChain: fromChainId, resolvedToChain: toChainId } = useResolvedSwapTokens();
    const fromAmount = useAtomValue(fromAmountAtom);
    const slippage = useAtomValue(slippageAtom);

    const setSwapStep = useSetAtom(swapStepAtom);
    const setFromAmount = useSetAtom(fromAmountAtom);

    const { evmWalletName, solanaWalletName, isPrivyReady } = useSwapContextWalletAddresses();
    const accessPath = useAtomValue(accessPathAtom);

    const walletAddress = useEffectiveSwapWalletAddress('pay', fromChainId);
    const recipientAddress = useEffectiveSwapWalletAddress('receive', toChainId ?? fromChainId);

    const refetchBalances = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['swap-user-tokens'] });
        queryClient.invalidateQueries({ queryKey: ['multi-chain-token'] });
        queryClient.invalidateQueries({ queryKey: ['swap-panel-balances'] });
    }, [queryClient]);
    const onSuccess = useCallback(
        async (params: SwapSuccessParams, eventParams: SwapAnalyticsParams) => {
            const analyticsParams = buildSwapAnalyticsParams({
                solanaWalletName,
                evmWalletName,
                ...eventParams,
            });
            await handleSwapSuccess({
                ...params,
                analyticsParams,
                refetchBalances,
            });
        },
        [solanaWalletName, evmWalletName, refetchBalances],
    );
    const onSwapStart = useCallback(
        (params: SwapAnalyticsParams) => {
            const analyticsParams = buildSwapAnalyticsParams({
                solanaWalletName,
                evmWalletName,
                ...params,
            });
            captureWalletTelemetryEvent(
                params.isCrossChain ? WalletTelemetryEventId.BRIDGE_SUBMIT : WalletTelemetryEventId.SWAP_SUBMIT,
                analyticsParams,
            );
        },
        [solanaWalletName, evmWalletName],
    );

    const { execute, ...rest } = useSwapExecuteCore({
        fromToken,
        toToken,
        fromAmount,
        fromChainId,
        walletAddress,
        slippage,
        toChainId,
        recipientAddress,
        isPrivyReady,
        accessPath,
        onStepChange: setSwapStep,
        onFromAmountChange: setFromAmount,
        onSuccess,
        onSwapStart,
    });

    const [{ loading, error }, handleExecute] = useAsyncFn(async () => {
        if (!walletAddress || !recipientAddress || !evmAddress || !solanaAddress) return execute();

        const allAddresses = [evmAddress, solanaAddress];
        if (
            allAddresses.some((x) => isSameAddress(x, walletAddress)) &&
            allAddresses.some((x) => isSameAddress(x, recipientAddress))
        ) {
            return withSkipPinCodeCheck(execute);
        }

        return execute();
    }, [walletAddress, recipientAddress, evmAddress, solanaAddress, execute]);

    return {
        ...rest,
        loading: loading || rest.loading,
        error: error?.message || rest.error,
        execute: handleExecute,
    };
}
