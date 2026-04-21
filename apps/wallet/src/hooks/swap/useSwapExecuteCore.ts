import { web3 } from '@coral-xyz/anchor';
import { delay } from '@dimensiondev/utils';
import { waitForEthereumTransaction } from '@dimensiondev/web3/actions';
import { type ChainId, isSolanaChain } from '@dimensiondev/web3/chains';
import { getSolanaRPCUrl } from '@dimensiondev/web3/utils';
import { t } from '@lingui/core/macro';
import { type ConnectedWallet, useWallets as useEvmWallets } from '@privy-io/react-auth';
import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana';
import { CoreConnectionController, CoreProviderController } from '@reown/appkit';
import type { Provider as SolanaProvider } from '@reown/appkit-adapter-solana';
import bs58 from 'bs58';
import { useAtomValue } from 'jotai';
import { type ReactNode, useState } from 'react';
import { useAsyncFn } from 'react-use';
import { toast } from 'sonner';
import type { Address, Hex } from 'viem';
import { sendTransaction } from 'wagmi/actions';

import { config } from '@/configs/wagmiClient.js';
import { env } from '@/constants/env.js';
import { tryFreeGasTransaction } from '@/helpers/freeGas/tryFreeGasTransaction.js';
import { getUserFacingErrorMessage } from '@/helpers/getErrorMessage.js';
import { signAndBroadcastSolanaTransaction } from '@/helpers/signAndBroadcastSolanaTransaction.js';
import type { BuildSwapAnalyticsParamsInput } from '@/helpers/swap/buildSwapAnalyticsParams.js';
import { estimateSwapGas } from '@/helpers/swap/estimateSwapGas.js';
import { executeEvmApproval } from '@/helpers/swap/executeEvmApproval.js';
import { fetchSwapQuote } from '@/helpers/swap/fetchSwapQuote.js';
import type { HandleSwapSuccessParams } from '@/helpers/swap/handleSwapSuccess.js';
import { resolveSwapEvmConnector, switchSwapEvmConnectorChain } from '@/helpers/swap/resolveSwapEvmConnector.js';
import {
    resolveSwapEvmSigningWallet,
    resolveSwapSolanaSigningWallet,
} from '@/helpers/swap/resolveSwapSigningWallet.js';
import { toastLoading } from '@/helpers/toastLoading.js';
import { useAppKitSolanaWallets } from '@/hooks/useAppKitSolanaWallets.js';
import { logger } from '@/lib/Logger.js';
import { createSwapEndpoint, type SwapToken } from '@/providers/swap/index.js';
import type { FreeGasTxType } from '@/providers/types/FreeGas.js';
import { fireflySessionTokenAtom } from '@/store/fireflySession.js';
import { getSlippagePercent, type SlippageValue } from '@/store/swap/swapSettings.js';
import { SwapAccessPath, type SwapStep } from '@/store/swap/swapState.js';

export type SwapSuccessParams = Omit<HandleSwapSuccessParams, 'refetchBalances' | 'analyticsParams'>;
export type SwapAnalyticsParams = Omit<BuildSwapAnalyticsParamsInput, 'solanaWalletName' | 'evmWalletName'>;

interface ExecuteEvmSwapParams {
    quoteParams: Parameters<typeof fetchSwapQuote>[0];
    evmSigningWallet: ConnectedWallet;
    fromToken: { address: string; decimals: number };
    fromAmount: string;
    chainId: number;
    walletAddress: string;
    isCrossChain: boolean;
    toastId: string;
    endpoint: ReturnType<typeof createSwapEndpoint>;
    setTxHash: (hash: string | null) => void;
    setFromAmount: (amount: string) => void;
    setSwapStep: (step: 'input' | 'review' | 'processing') => void;
    onSuccess?: (data: SwapSuccessParams) => Promise<void>;
    freeGasTxType?: FreeGasTxType;
}
interface SolanaSigningWallet {
    type: 'privy' | 'appkit';
    wallet: any;
}
interface ExecuteSolanaSwapParams {
    quoteResult: { tx: { data: string; to: string; value: string; gas?: string; gasPrice?: string } };
    solanaSigningWallet: SolanaSigningWallet;
    chainId: number;
    isCrossChain: boolean;
    toastId: string;
    endpoint: ReturnType<typeof createSwapEndpoint>;
    setTxHash: (hash: string | null) => void;
    setFromAmount: (amount: string) => void;
    setSwapStep: (step: 'input' | 'review' | 'processing') => void;
    onSuccess?: (data: SwapSuccessParams) => Promise<void>;
}
interface ExecuteSwapParams {
    fromToken: SwapToken | null;
    toToken: SwapToken | null;
    fromAmount: string;
    fromChainId: number | null;
    walletAddress: string | null;
    slippage: SlippageValue;
    toChainId: number;
    recipientAddress: string | null;
    isPrivyReady: boolean;
    accessPath: SwapAccessPath;
    throwError?: boolean;
    onStepChange: (step: SwapStep) => void;
    onFromAmountChange: (amount: string) => void;
    onSwapStart?: (data: SwapAnalyticsParams) => void;
    onSuccess: (data: SwapSuccessParams, eventParams: SwapAnalyticsParams) => Promise<void>;
    freeGasTxType?: FreeGasTxType;
}

async function executeEvmSwap({
    quoteParams,
    evmSigningWallet,
    fromToken,
    fromAmount,
    chainId,
    walletAddress,
    isCrossChain,
    toastId,
    endpoint,
    setTxHash,
    setFromAmount,
    setSwapStep,
    onSuccess,
    freeGasTxType,
}: ExecuteEvmSwapParams): Promise<void> {
    const connector = await resolveSwapEvmConnector(evmSigningWallet);
    if (!connector) {
        throw new Error('Selected EVM wallet connector is not available for signing');
    }

    await switchSwapEvmConnectorChain(evmSigningWallet, connector, chainId);
    const quoteResult = await fetchSwapQuote(quoteParams);

    // Check and execute ERC20 approval if needed
    await executeEvmApproval({
        endpoint,
        fromToken: fromToken as any,
        fromAmount,
        chainId,
        walletAddress,
        routerAddress: quoteResult.tx.to,
        connector,
        isCrossChain,
        toChainId: quoteParams.toChainId,
        toTokenAddress: quoteParams.toTokenAddress,
        slippage: quoteParams.slippagePercent,
        recipientAddress: quoteParams.recipientAddress,
    });

    // Send swap transaction
    const gas = await estimateSwapGas({
        chainId,
        to: quoteResult.tx.to as Address,
        data: quoteResult.tx.data as Hex,
        value: BigInt(quoteResult.tx.value || '0'),
        account: walletAddress as Address,
    });

    let hash: Hex | undefined;

    // Try free-gas if available
    if (freeGasTxType) {
        const freeGasResult = await tryFreeGasTransaction({
            chainId,
            txType: freeGasTxType,
            from: walletAddress as Address,
            to: quoteResult.tx.to as Address,
            data: quoteResult.tx.data as Hex,
            value: BigInt(quoteResult.tx.value || '0').toString(),
            tokenAddress: fromToken.address,
        });
        if (freeGasResult.type === 'free-gas') {
            hash = freeGasResult.hash as Hex;
        }
    }

    if (!hash) {
        hash = await sendTransaction(config, {
            chainId: chainId as ChainId,
            connector,
            account: walletAddress as Address,
            to: quoteResult.tx.to as Address,
            data: quoteResult.tx.data as Hex,
            value: BigInt(quoteResult.tx.value || '0'),
            gas,
            ...(quoteResult.tx.gasPrice ? { gasPrice: BigInt(quoteResult.tx.gasPrice) } : {}),
        });
    }

    setTxHash(hash);

    // Show loading toast, reset amount
    toastLoading(t`Confirming your transaction...`, { id: toastId });
    setFromAmount('');
    setSwapStep('input');

    // Wait for on-chain confirmation
    await waitForEthereumTransaction(config, chainId, hash);

    if (onSuccess) {
        await onSuccess({
            hash,
            chainId,
            isCrossChain,
            isSolana: false,
            toastId,
            endpoint,
        });
    }
}
async function executeSolanaSwap({
    quoteResult,
    solanaSigningWallet,
    chainId,
    isCrossChain,
    toastId,
    endpoint,
    setTxHash,
    setFromAmount,
    setSwapStep,
    onSuccess,
}: ExecuteSolanaSwapParams): Promise<void> {
    const txBytes = bs58.decode(quoteResult.tx.data);

    let hash: string;
    if (solanaSigningWallet.type === 'appkit') {
        // Use AppKit provider for external Solana wallets
        await CoreConnectionController.switchConnection({
            connection: solanaSigningWallet.wallet.connection,
            namespace: 'solana',
        });
        const provider = CoreProviderController.state.providers.solana as SolanaProvider;
        if (!provider) throw new Error('AppKit Solana provider not available');

        const transaction = web3.VersionedTransaction.deserialize(txBytes);
        const connection = new web3.Connection(
            getSolanaRPCUrl({ httpUrl: env.external.NEXT_PUBLIC_SOLANA_RPC_URL }),
            'confirmed',
        );
        const signature = await provider.sendTransaction(transaction, connection);
        hash = typeof signature === 'string' ? signature : bs58.encode(signature);
    } else {
        // Use Privy signing path
        hash = await signAndBroadcastSolanaTransaction(solanaSigningWallet.wallet, new Uint8Array(txBytes));
    }
    setTxHash(hash);

    // Show loading toast, reset amount
    toastLoading(t`Confirming your transaction...`, { id: toastId });
    setFromAmount('');
    setSwapStep('input');

    // Wait for on-chain confirmation by polling signature status.
    // Using getLatestBlockhash AFTER broadcast is unreliable — lastValidBlockHeight
    // may already be in the past, causing confirmTransaction to reject a succeeded tx.
    const connection = new web3.Connection(
        getSolanaRPCUrl({ httpUrl: env.external.NEXT_PUBLIC_SOLANA_RPC_URL }),
        'confirmed',
    );
    let confirmed = false;
    for (let i = 0; i < 60; i += 1) {
        const statuses = await connection.getSignatureStatuses([hash]);
        const status = statuses.value[0];
        if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') {
            confirmed = true;
            break;
        }
        if (status?.err) {
            throw new Error(`Transaction failed on-chain: ${JSON.stringify(status.err)}`);
        }
        await new Promise<void>((resolve) => setTimeout(resolve, 1000));
    }

    if (!confirmed) {
        throw new Error('Transaction confirmation timeout');
    }

    if (onSuccess) {
        await onSuccess({
            hash,
            chainId,
            isCrossChain,
            isSolana: true,
            toastId,
            endpoint,
        });
    }
}

export function useSwapExecuteCore({
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
    throwError,
    onStepChange,
    onFromAmountChange,
    onSuccess,
    onSwapStart,
    freeGasTxType,
}: ExecuteSwapParams) {
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    const authToken = useAtomValue(fireflySessionTokenAtom);
    const { wallets: solanaWallets } = useSolanaWallets();
    const { wallets: evmWallets } = useEvmWallets();
    const appKitSolanaWallets = useAppKitSolanaWallets();

    const preferEmbeddedSigner = accessPath === SwapAccessPath.WalletGUI;
    const evmSigningWallet = resolveSwapEvmSigningWallet(evmWallets, walletAddress, {
        preferEmbedded: preferEmbeddedSigner,
    });
    const solanaSigningWallet = resolveSwapSolanaSigningWallet(walletAddress, solanaWallets, appKitSolanaWallets, {
        preferEmbedded: preferEmbeddedSigner,
    });

    const [{ loading }, execute] = useAsyncFn(async () => {
        if (!fromToken || !toToken || !fromAmount || !fromChainId || !isPrivyReady) {
            setError('Missing swap parameters');
            return;
        }

        if (!walletAddress) {
            setError('Wallet not connected');
            return;
        }

        setError(null);
        setTxHash(null);
        onStepChange('processing');

        const toastId = `swap-${Date.now()}`;
        const isSolana = isSolanaChain(fromChainId);

        try {
            const slippagePercent = getSlippagePercent(slippage);
            const endpoint = createSwapEndpoint(authToken ?? undefined);
            const isCrossChain = toChainId !== fromChainId;

            const analyticsParams: SwapAnalyticsParams = {
                walletAddress,
                isSolana,
                fromToken,
                toToken,
                fromAmount,
                fromChainId,
                toChainId: toChainId ?? fromChainId,
                isCrossChain,
                accessPath,
            };
            onSwapStart?.(analyticsParams);

            const quoteParams = {
                endpoint,
                isCrossChain,
                fromTokenAddress: fromToken.address,
                toTokenAddress: toToken.address,
                amount: fromAmount,
                fromChainId,
                toChainId: toChainId ?? fromChainId,
                fromDecimals: fromToken.decimals,
                slippagePercent: slippagePercent.toString(),
                walletAddress,
                recipientAddress: recipientAddress ?? undefined,
            };
            if (isSolana) {
                const quoteResult = await fetchSwapQuote(quoteParams);
                if (!solanaSigningWallet) throw new Error('Selected Solana wallet is not available for signing');

                await executeSolanaSwap({
                    quoteResult,
                    solanaSigningWallet,
                    chainId: fromChainId,
                    isCrossChain,
                    toastId,
                    endpoint,
                    setTxHash,
                    setFromAmount: onFromAmountChange,
                    setSwapStep: onStepChange,
                    onSuccess: (data) => onSuccess(data, analyticsParams),
                });
            } else {
                if (!evmSigningWallet) throw new Error('Selected EVM wallet is not available for signing');
                await executeEvmSwap({
                    quoteParams,
                    evmSigningWallet,
                    fromToken,
                    fromAmount,
                    chainId: fromChainId,
                    walletAddress: walletAddress!,
                    isCrossChain,
                    toastId,
                    endpoint,
                    setTxHash,
                    setFromAmount: onFromAmountChange,
                    setSwapStep: onStepChange,
                    onSuccess: (data) => onSuccess(data, analyticsParams),
                    freeGasTxType,
                });
            }
        } catch (err) {
            let errorMessage: ReturnType<typeof t> | ReactNode = t`Your transaction failed.`;
            const isUserRejection =
                err instanceof Error &&
                (err.message.toLowerCase().includes('rejected') ||
                    err.message.toLowerCase().includes('denied') ||
                    err.message.toLowerCase().includes('cancelled'));

            if (isUserRejection) {
                errorMessage = t`User rejected`;
                // icon of `loading` is exactly matching the design.
                toastLoading(errorMessage, { id: toastId });
                await delay(2000);
                toast.dismiss(toastId);
            } else {
                logger.error('Swap execution failed:', err);
                if (err instanceof Error && err.message.toLowerCase().includes('min return not reached')) {
                    errorMessage = t`Transaction failed: minimum return amount not reached. Try increasing slippage.`;
                } else {
                    errorMessage = getUserFacingErrorMessage(err).message;
                }
                toast.error(errorMessage, { id: toastId });
            }
            setError(getUserFacingErrorMessage(err).details);
            onStepChange('input');

            if (throwError) throw err;
        }
    }, [
        authToken,
        fromToken,
        toToken,
        fromAmount,
        fromChainId,
        walletAddress,
        slippage,
        toChainId,
        recipientAddress,
        isPrivyReady,
        evmSigningWallet,
        solanaSigningWallet,
        accessPath,
        throwError,
        onStepChange,
        onFromAmountChange,
        onSuccess,
        onSwapStart,
        freeGasTxType,
    ]);

    return {
        error,
        txHash,
        loading,
        execute,
    };
}
