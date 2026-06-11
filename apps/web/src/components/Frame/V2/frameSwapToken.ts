import { SwapAccessPath } from '@dimensiondev/enums';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { parseCAIP19 } from '@dimensiondev/web3/utils';
import type { MiniAppHost } from '@farcaster/miniapp-host';
import type { Connector } from '@wagmi/core';
import { getConnection } from '@wagmi/core';
import type { Address } from 'viem';
import { mainnet } from 'viem/chains';

import { FIREFLY_WALLET_IFRAME_ID } from '@/components/FireflyWallet.js';
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { walletConnectIcon, walletConnectId } from '@/constants/reown.js';
import { fetchEnsName } from '@/hooks/useEnsName.js';
import { logger } from '@/libs/Logger.js';
import { SolanaNetwork } from '@/providers/solana/Network.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

function resolveExternalEvmIcon(connector: Connector | undefined) {
    if (!connector) return undefined;
    if (connector.id.toLowerCase() === walletConnectId.toLowerCase()) return walletConnectIcon;
    return connector.icon;
}

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
    const evmAccount = getConnection(wagmiConfig);
    const evmEnsName = evmAccount.address
        ? await fetchEnsName({ address: evmAccount.address as Address, chainId: mainnet.id }).catch(() => null)
        : null;
    const evmIcon = resolveExternalEvmIcon(evmAccount.connector);
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
    if (evmAccount.address) {
        params.set('externalEvm', evmAccount.address);
        if (evmEnsName) params.set('externalEvmName', evmEnsName);
        if (evmIcon) params.set('externalEvmIcon', evmIcon);
    }
    if (solanaAddress) params.set('externalSolana', solanaAddress);

    const swapPath = `/swap?${params.toString()}`;

    useGlobalState.getState().updateFireflyWalletIsOpen(true);
    iframeBridgeProvider.request(
        IframeBridgeMethod.NAVIGATE,
        { path: swapPath },
        {
            targetIframeId: FIREFLY_WALLET_IFRAME_ID,
        },
    );

    // TODO We can't get the result of the swap yet.
    return {
        success: true,
        swap: {
            transactions: [],
        },
    };
} as MiniAppHost['swapToken'];
