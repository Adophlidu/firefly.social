import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import type { MiniAppHost } from '@farcaster/miniapp-host';
import { getAccount } from '@wagmi/core';

import { SwapAccessPath } from '@/components/TokenProfile/SwapButton.js';
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { parseCAIP19 } from '@/helpers/parseCAIP19.js';
import { logger } from '@/libs/Logger.js';
import { SolanaNetwork } from '@/providers/solana/Network.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

export const frameSwapToken = async function frameSwapToken(options) {
    const buyToken = options.buyToken ? parseCAIP19(options.buyToken) : undefined;
    const sellToken = options.sellToken ? parseCAIP19(options.sellToken) : undefined;
    if (!buyToken && !sellToken) {
        logger.warn('[frame host]: swapToken', options);
        return { success: false, reason: 'swap_failed' };
    }
    const originChainId = buyToken?.chainReference || sellToken?.chainReference;
    if (!originChainId) {
        logger.warn('No chain id', options);
        return { success: false, reason: 'swap_failed' };
    }
    const chainId = Number.parseInt(originChainId, 10);
    const buyTokenAddress = buyToken?.reference;
    const sellTokenAddress = sellToken?.reference;

    // Get external wallet addresses
    const evmAccount = getAccount(wagmiConfig);
    let solanaAddress: string | undefined;
    try {
        solanaAddress = await SolanaNetwork.getAccount();
    } catch {
        // Solana wallet not connected
    }

    const params = new URLSearchParams();
    params.set('entry', SwapAccessPath.TokenDetail);
    params.set('chain', chainId.toString());
    if (sellTokenAddress) params.set('from', sellTokenAddress);
    if (buyTokenAddress) params.set('to', buyTokenAddress);
    if (evmAccount.address) params.set('externalEvm', evmAccount.address);
    if (solanaAddress) params.set('externalSolana', solanaAddress);

    const swapPath = `/swap?${params.toString()}`;

    useGlobalState.getState().updateFireflyWalletIsOpen(true);
    iframeBridgeProvider.request(IframeBridgeMethod.NAVIGATE, { path: swapPath });

    // TODO We can't get the result of the swap yet.
    return {
        success: true,
        swap: {
            transactions: [],
        },
    };
} as MiniAppHost['swapToken'];
