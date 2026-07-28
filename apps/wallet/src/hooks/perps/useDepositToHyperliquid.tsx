import { SwapAccessPath } from '@dimensiondev/enums';
import { isSolanaChain } from '@dimensiondev/web3/chains';
import { isNativeTokenOrSameAddress } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useComeback } from '@/components/useComeback.js';
import {
    ARBITRUM_CHAIN_ID,
    ARBITRUM_USDC_ADDRESS,
    HYPERLIQUID_CHAIN_ID,
    hyperliquidUsdcTokenFallback,
} from '@/constants/hyperliquid.js';
import { getUserFacingErrorMessage } from '@/helpers/getErrorMessage.js';
import { invalidatePerpsQueries } from '@/helpers/invalidatePerpsQueries.js';
import { publishPerpsMutation } from '@/helpers/perpsMutation.js';
import { uploadSwapTx } from '@/helpers/swap/uploadSwapTx.js';
import { withSkipPinCodeCheck } from '@/helpers/withSkipPinCodeCheck.js';
import { useDepositArbitrumUsdcToHyperliquid } from '@/hooks/perps/useDepositArbitrumUsdcToHyperliquid.js';
import { useSwapExecuteCore } from '@/hooks/swap/useSwapExecuteCore.js';
import { useEmbeddedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import type { SwapToken } from '@/providers/swap/types.js';
import { FreeGasTxType } from '@/providers/types/FreeGas.js';
import { showEmbeddedWalletUIAtom } from '@/store/embeddedWallets.js';
import { store } from '@/store/index.js';

interface Options {
    depositToken?: SwapToken;
    amount: string;
    toastId: string;
    onSettled?: () => void;
}

export function useDepositToHyperliquid({ depositToken, amount, toastId, onSettled }: Options) {
    const comeback = useComeback('/perps');
    const queryClient = useQueryClient();
    const { evmAddress, solanaAddress, isPrivyReady } = useEmbeddedWalletAddresses();
    const { mutateAsync: transferArbUsdc } = useDepositArbitrumUsdcToHyperliquid({ toastId });

    const walletAddress = !depositToken ? null : isSolanaChain(depositToken.chainId) ? solanaAddress : evmAddress;
    const isSameToken =
        depositToken?.chainId === ARBITRUM_CHAIN_ID &&
        isNativeTokenOrSameAddress(depositToken.address, ARBITRUM_USDC_ADDRESS);

    const { execute: depositWithSwap } = useSwapExecuteCore({
        fromToken: depositToken ?? null,
        toToken: hyperliquidUsdcTokenFallback,
        fromAmount: amount,
        fromChainId: depositToken?.chainId ?? null,
        walletAddress,
        slippage: 'auto',
        toChainId: HYPERLIQUID_CHAIN_ID,
        recipientAddress: evmAddress,
        isPrivyReady,
        accessPath: SwapAccessPath.WalletGUI,
        freeGasTxType: FreeGasTxType.TokenTransfer,
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

                if (isSameToken) {
                    await transferArbUsdc(amount);
                } else {
                    await depositWithSwap();
                }
            }),
        async onSuccess() {
            store.set(showEmbeddedWalletUIAtom, true);
            await invalidatePerpsQueries(queryClient, { includeTokenBalance: true });
            toast.dismiss(toastId);
            toast.success(<Trans>Deposit submitted. Funds will appear on Hyperliquid shortly.</Trans>);
            publishPerpsMutation('deposit', 'success');
            comeback();
        },
        onError(error: unknown) {
            store.set(showEmbeddedWalletUIAtom, true);
            toast.dismiss(toastId);
            const { message: userHint, details } = getUserFacingErrorMessage(error);
            toast.error(<Trans>Deposit failed.</Trans>, { description: userHint || details });
            publishPerpsMutation('deposit', 'failed');
        },
        onSettled,
    });
}
