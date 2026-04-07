import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { t } from '@lingui/core/macro';
import { toast } from 'sonner';

import { type EthereumChainId } from '@/constants/ethereum.js';
import { SolanaChainId } from '@/constants/solana.js';
import { getBlockExplorersURL } from '@/helpers/getBlockExplorersURL.js';
import { type SwapAnalyticsParams } from '@/helpers/swap/buildSwapAnalyticsParams.js';
import { captureWalletTelemetryEvent, WalletTelemetryEventId } from '@/helpers/swap/swapAnalytics.js';
import { uploadSwapTx } from '@/helpers/swap/uploadSwapTx.js';
import { type SwapEndpoint } from '@/providers/swap/swapEndpoint.js';

interface HandleSwapSuccessParams {
    hash: string;
    chainId: number;
    isCrossChain: boolean;
    isSolana: boolean;
    toastId: string;
    analyticsParams: SwapAnalyticsParams;
    endpoint: SwapEndpoint;
    refetchBalances: () => void;
}

export async function handleSwapSuccess(params: HandleSwapSuccessParams): Promise<void> {
    const { hash, chainId, isCrossChain, isSolana, toastId, analyticsParams, endpoint, refetchBalances } = params;

    const txUrl = getBlockExplorersURL(isSolana ? SolanaChainId.Mainnet : (chainId as EthereumChainId), hash, 'tx');

    toast.success(t`Your transaction has been completed.`, {
        id: toastId,
        action: {
            label: t`View`,
            onClick: () => window.open(txUrl, '_blank'),
        },
    });
    refetchBalances();

    captureWalletTelemetryEvent(
        isCrossChain ? WalletTelemetryEventId.BRIDGE_SUCCESS : WalletTelemetryEventId.SWAP_SUCCESS,
        {
            ...analyticsParams,
            tx_hash: hash,
        },
    );

    await uploadSwapTx(endpoint, chainId, hash, isCrossChain);
    iframeBridgeProvider.request(IframeBridgeMethod.NAVIGATE, {
        path: `/tx/${chainId}/${hash}`,
    });
}
