import { InvalidResultError, retry } from '@dimensiondev/utils';
import { isSolanaChain } from '@dimensiondev/web3/chains';
import { multipliedBy } from '@dimensiondev/web3/numbers';
import { isNativeTokenOrSameAddress } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import type { Address } from 'viem';
import { polygon } from 'viem/chains';

import { getUserFacingErrorMessage } from '@/helpers/getErrorMessage.js';
import { optimisticAddBalance } from '@/helpers/polymarketBalanceCache.js';
import { uploadSwapTx } from '@/helpers/swap/uploadSwapTx.js';
import { withSkipPinCodeCheck } from '@/helpers/withSkipPinCodeCheck.js';
import { useAddFundsWithPolUsdc } from '@/hooks/bet/useAddFundsWithPolUsdc.js';
import { pusdTokenFallback } from '@/hooks/bet/useTokenDetail.js';
import { useSwapExecuteCore } from '@/hooks/swap/useSwapExecuteCore.js';
import { useEmbeddedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import type { SwapToken } from '@/providers/swap/types.js';
import { FreeGasTxType } from '@/providers/types/FreeGas.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getPolymarketProfileListQueryOptions } from '@/queries/firefly/getPolymarketProfileListQueryOptions.js';
import { getPolymarketUserValueQueryOptions } from '@/queries/polymarket/getPolymarketUserValueQueryOptions.js';
import { showEmbeddedWalletUIAtom } from '@/store/embeddedWallets.js';
import { store } from '@/store/index.js';
import { SwapAccessPath } from '@/store/swap/swapState.js';

interface Options {
    depositToken?: SwapToken;
    polymarketAddress?: string;
    amount: string;
    toastId: string;
    onSettled?: () => void;
}

export function useAddFunds(options: Options) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { evmAddress, solanaAddress, isPrivyReady } = useEmbeddedWalletAddresses();
    const [, addFundsWithPolUsdc] = useAddFundsWithPolUsdc(options);

    const { depositToken, polymarketAddress, amount, toastId, onSettled } = options;
    const walletAddress = !depositToken ? null : isSolanaChain(depositToken.chainId) ? solanaAddress : evmAddress;
    const { execute: addFundsWithSwap } = useSwapExecuteCore({
        fromToken: depositToken ?? null,
        toToken: pusdTokenFallback,
        fromAmount: amount,
        fromChainId: depositToken?.chainId ?? null,
        walletAddress,
        slippage: 'auto',
        toChainId: pusdTokenFallback.chainId,
        recipientAddress: polymarketAddress ?? null,
        isPrivyReady,
        accessPath: SwapAccessPath.WalletGUI,
        freeGasTxType: FreeGasTxType.PolymarketDeposit,
        throwError: true,
        onStepChange: () => {},
        onFromAmountChange: () => {},
        onSuccess: async ({ toastId: innerToastId, endpoint, chainId, hash, isCrossChain }) => {
            toast.dismiss(innerToastId);
            await uploadSwapTx(endpoint, chainId, hash, isCrossChain);
        },
    });

    return useMutation({
        mutationFn: () =>
            withSkipPinCodeCheck(async () => {
                store.set(showEmbeddedWalletUIAtom, false);

                if (!walletAddress || !isPrivyReady) {
                    throw new Error('Wallet not ready');
                }
                if (!depositToken) {
                    throw new Error('Deposit token not ready');
                }
                if (!polymarketAddress) {
                    throw new Error('Polymarket address not ready');
                }

                if (
                    depositToken.chainId === pusdTokenFallback.chainId &&
                    isNativeTokenOrSameAddress(depositToken.address, pusdTokenFallback.address)
                ) {
                    await addFundsWithPolUsdc();
                } else {
                    await addFundsWithSwap();
                }

                return polymarketAddress as Address;
            }),
        async onSuccess(proxyAddress) {
            store.set(showEmbeddedWalletUIAtom, true);
            optimisticAddBalance(queryClient, proxyAddress, multipliedBy(amount, depositToken?.price ?? 0));

            try {
                await retry(
                    async () => {
                        try {
                            const result = await queryClient.fetchQuery({
                                ...getPolymarketAccountQueryOptions(),
                                staleTime: 0,
                            });
                            if (!result?.proxyAddress) {
                                throw new InvalidResultError();
                            }

                            return result.proxyAddress;
                        } catch {
                            throw new InvalidResultError();
                        }
                    },
                    { times: 10, interval: 1000 },
                );
            } catch {}

            await Promise.all([
                queryClient.refetchQueries({
                    queryKey: getPolymarketAccountQueryOptions().queryKey,
                    exact: true,
                    type: 'all',
                }),
                queryClient.refetchQueries({
                    queryKey: getPolymarketProfileListQueryOptions(proxyAddress, true).queryKey,
                }),
                queryClient.refetchQueries({ queryKey: ['multi-chain-token', proxyAddress.toLowerCase(), polygon.id] }),
                queryClient.refetchQueries({ queryKey: ['polymarket-balance'] }),
                queryClient.refetchQueries({
                    queryKey: getPolymarketUserValueQueryOptions(proxyAddress).queryKey,
                    exact: true,
                    type: 'all',
                }),
            ]);
            toast.dismiss(toastId);
            toast.success(<Trans>Your funds are now in your predict wallet.</Trans>);
            navigate({ to: '/bet' });
        },
        onError(error: unknown) {
            store.set(showEmbeddedWalletUIAtom, true);
            toast.dismiss(toastId);
            const { message: userHint, details } = getUserFacingErrorMessage(error);
            toast.error(<Trans>Failed to add funds.</Trans>, { description: userHint || details });
        },
        onSettled,
    });
}
