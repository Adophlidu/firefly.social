import { web3 } from '@coral-xyz/anchor';
import { delay } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { type ConnectedWallet, useWallets as useEvmWallets } from '@privy-io/react-auth';
import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana';
import { CoreConnectionController, CoreProviderController } from '@reown/appkit';
import { type Provider as SolanaProvider } from '@reown/appkit-adapter-solana';
import { useQueryClient } from '@tanstack/react-query';
import bs58 from 'bs58';
import { useAtomValue, useSetAtom } from 'jotai';
import { type ReactNode, useCallback, useState } from 'react';
import { useAsyncFn } from 'react-use';
import { toast } from 'sonner';
import { type Address, type Hex } from 'viem';
import { sendTransaction } from 'wagmi/actions';

import { config } from '@/configs/wagmi.js';
import { getUserFacingErrorMessage } from '@/helpers/getErrorMessage.js';
import { getSolanaRPCUrl } from '@/helpers/getSolanaRPCUrl.js';
import { isSolanaChain } from '@/helpers/isSolanaChain.js';
import { signAndBroadcastSolanaTransaction } from '@/helpers/signAndBroadcastSolanaTransaction.js';
import { buildSwapAnalyticsParams } from '@/helpers/swap/buildSwapAnalyticsParams.js';
import { estimateSwapGas } from '@/helpers/swap/estimateSwapGas.js';
import { executeEvmApproval } from '@/helpers/swap/executeEvmApproval.js';
import { fetchSwapQuote } from '@/helpers/swap/fetchSwapQuote.js';
import { handleSwapSuccess } from '@/helpers/swap/handleSwapSuccess.js';
import { resolveSwapEvmConnector, switchSwapEvmConnectorChain } from '@/helpers/swap/resolveSwapEvmConnector.js';
import {
    resolveSwapEvmSigningWallet,
    resolveSwapSolanaSigningWallet,
} from '@/helpers/swap/resolveSwapSigningWallet.js';
import { captureWalletTelemetryEvent, WalletTelemetryEventId } from '@/helpers/swap/swapAnalytics.js';
import { waitForEthereumTransaction } from '@/helpers/waitForEthereumTransaction.js';
import { useEffectiveSwapWalletAddress } from '@/hooks/swap/useEffectiveSwapWalletAddress.js';
import { useResolvedSwapTokens } from '@/hooks/swap/useResolvedSwapTokens.js';
import { useAppKitSolanaWallets } from '@/hooks/useAppKitSolanaWallets.js';
import { useSwapContextWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { logger } from '@/lib/Logger.js';
import { createSwapEndpoint } from '@/providers/swap/index.js';
import { fireflySessionTokenAtom } from '@/store/fireflySession.js';
import { getSlippagePercent, slippageAtom } from '@/store/swap/swapSettings.js';
import {
    accessPathAtom,
    fromAmountAtom,
    isCrossChainAtom,
    SwapAccessPath,
    swapStepAtom,
} from '@/store/swap/swapState.js';

export interface UseSwapExecuteResult {
    error: string | null;
    txHash: string | null;
    loading: boolean;
    execute: () => Promise<void>;
}

export function useSwapExecute(): UseSwapExecuteResult {
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    const { fromToken, toToken, resolvedFromChain: fromChainId, resolvedToChain: toChainId } = useResolvedSwapTokens();
    const fromAmount = useAtomValue(fromAmountAtom);
    const isCrossChain = useAtomValue(isCrossChainAtom);
    const slippage = useAtomValue(slippageAtom);

    const setSwapStep = useSetAtom(swapStepAtom);
    const setFromAmount = useSetAtom(fromAmountAtom);

    const { evmWalletName, solanaWalletName, isPrivyReady } = useSwapContextWalletAddresses();
    const { wallets: solanaWallets } = useSolanaWallets();
    const { wallets: evmWallets } = useEvmWallets();
    const appKitSolanaWallets = useAppKitSolanaWallets();
    const accessPath = useAtomValue(accessPathAtom);
    const authToken = useAtomValue(fireflySessionTokenAtom);
    const preferEmbeddedSigner = accessPath === SwapAccessPath.WalletGUI;

    const walletAddress = useEffectiveSwapWalletAddress('pay', fromChainId);
    const recipientAddress = useEffectiveSwapWalletAddress('receive', toChainId ?? fromChainId);
    const evmSigningWallet = resolveSwapEvmSigningWallet(evmWallets, walletAddress, {
        preferEmbedded: preferEmbeddedSigner,
    });
    const solanaSigningWallet = resolveSwapSolanaSigningWallet(walletAddress, solanaWallets, appKitSolanaWallets, {
        preferEmbedded: preferEmbeddedSigner,
    });
    const refetchBalances = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['swap-user-tokens'] });
        queryClient.invalidateQueries({ queryKey: ['multi-chain-token'] });
        queryClient.invalidateQueries({ queryKey: ['swap-panel-balances'] });
    }, [queryClient]);

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
        setSwapStep('processing');

        const toastId = `swap-${Date.now()}`;
        const isSolana = isSolanaChain(fromChainId);

        try {
            const slippagePercent = getSlippagePercent(slippage);
            const endpoint = createSwapEndpoint(authToken ?? undefined);

            const analyticsParams = buildSwapAnalyticsParams({
                walletAddress,
                isSolana,
                solanaWalletName,
                evmWalletName,
                fromToken,
                toToken,
                fromAmount,
                fromChainId,
                toChainId: toChainId ?? fromChainId,
                isCrossChain,
                accessPath,
            });

            captureWalletTelemetryEvent(
                isCrossChain ? WalletTelemetryEventId.BRIDGE_SUBMIT : WalletTelemetryEventId.SWAP_SUBMIT,
                analyticsParams,
            );

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
                    analyticsParams,
                    endpoint,
                    setTxHash,
                    setFromAmount,
                    setSwapStep,
                    refetchBalances,
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
                    analyticsParams,
                    endpoint,
                    setTxHash,
                    setFromAmount,
                    setSwapStep,
                    refetchBalances,
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
                toast.loading(errorMessage, { id: toastId });
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
            setSwapStep('input');
        }
    }, [
        fromToken,
        toToken,
        fromAmount,
        fromChainId,
        isPrivyReady,
        walletAddress,
        setSwapStep,
        slippage,
        authToken,
        isCrossChain,
        solanaWalletName,
        evmWalletName,
        accessPath,
        toChainId,
        solanaSigningWallet,
        recipientAddress,
        setFromAmount,
        refetchBalances,
        evmSigningWallet,
    ]);

    return {
        error,
        txHash,
        loading,
        execute,
    };
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
    analyticsParams: Parameters<typeof handleSwapSuccess>[0]['analyticsParams'];
    endpoint: ReturnType<typeof createSwapEndpoint>;
    setTxHash: (hash: string | null) => void;
    setFromAmount: (amount: string) => void;
    setSwapStep: (step: 'input' | 'review' | 'processing') => void;
    refetchBalances: () => void;
}

async function executeSolanaSwap({
    quoteResult,
    solanaSigningWallet,
    chainId,
    isCrossChain,
    toastId,
    analyticsParams,
    endpoint,
    setTxHash,
    setFromAmount,
    setSwapStep,
    refetchBalances,
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
        const connection = new web3.Connection(getSolanaRPCUrl(), 'confirmed');
        const signature = await provider.sendTransaction(transaction, connection);
        hash = typeof signature === 'string' ? signature : bs58.encode(signature);
    } else {
        // Use Privy signing path
        hash = await signAndBroadcastSolanaTransaction(solanaSigningWallet.wallet, new Uint8Array(txBytes));
    }
    setTxHash(hash);

    // Show loading toast, reset amount
    toast.loading(t`Confirming your transaction...`, { id: toastId });
    setFromAmount('');
    setSwapStep('input');

    // Wait for on-chain confirmation by polling signature status.
    // Using getLatestBlockhash AFTER broadcast is unreliable — lastValidBlockHeight
    // may already be in the past, causing confirmTransaction to reject a succeeded tx.
    const connection = new web3.Connection(getSolanaRPCUrl(), 'confirmed');
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

    await handleSwapSuccess({
        hash,
        chainId,
        isCrossChain,
        isSolana: true,
        toastId,
        analyticsParams,
        endpoint,
        refetchBalances,
    });
}

interface ExecuteEvmSwapParams {
    quoteParams: Parameters<typeof fetchSwapQuote>[0];
    evmSigningWallet: ConnectedWallet;
    fromToken: { address: string; decimals: number };
    fromAmount: string;
    chainId: number;
    walletAddress: string;
    isCrossChain: boolean;
    toastId: string;
    analyticsParams: Parameters<typeof handleSwapSuccess>[0]['analyticsParams'];
    endpoint: ReturnType<typeof createSwapEndpoint>;
    setTxHash: (hash: string | null) => void;
    setFromAmount: (amount: string) => void;
    setSwapStep: (step: 'input' | 'review' | 'processing') => void;
    refetchBalances: () => void;
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
    analyticsParams,
    endpoint,
    setTxHash,
    setFromAmount,
    setSwapStep,
    refetchBalances,
}: ExecuteEvmSwapParams): Promise<void> {
    const connector = await resolveSwapEvmConnector(evmSigningWallet);
    if (!connector) {
        throw new Error('Selected EVM wallet connector is not available for signing');
    }

    await switchSwapEvmConnectorChain({ address: evmSigningWallet.address, connector }, chainId);
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
    });

    // Send swap transaction
    const gas = await estimateSwapGas({
        chainId,
        to: quoteResult.tx.to as Address,
        data: quoteResult.tx.data as Hex,
        value: BigInt(quoteResult.tx.value || '0'),
        account: walletAddress as Address,
    });

    const hash = await sendTransaction(config, {
        connector,
        account: walletAddress as Address,
        to: quoteResult.tx.to as Address,
        data: quoteResult.tx.data as Hex,
        value: BigInt(quoteResult.tx.value || '0'),
        gas,
        ...(quoteResult.tx.gasPrice ? { gasPrice: BigInt(quoteResult.tx.gasPrice) } : {}),
    });

    setTxHash(hash);

    // Show loading toast, reset amount
    toast.loading(t`Confirming your transaction...`, { id: toastId });
    setFromAmount('');
    setSwapStep('input');

    // Wait for on-chain confirmation
    await waitForEthereumTransaction(chainId, hash);

    await handleSwapSuccess({
        hash,
        chainId,
        isCrossChain,
        isSolana: false,
        toastId,
        analyticsParams,
        endpoint,
        refetchBalances,
    });
}
