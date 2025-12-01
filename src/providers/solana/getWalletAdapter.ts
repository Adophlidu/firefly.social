'use client';

import type { web3 } from '@coral-xyz/anchor';
import { unreachable } from '@dimensiondev/utils';
import { CoreProviderController } from '@reown/appkit';
import type { Provider } from '@reown/appkit-adapter-solana';

import { PrivySolanaProvider } from '@/connectors/PrivySolanaWalletAdapter.js';
import { NetworkType } from '@/constants/enum.js';
import { WalletNotConnectedError } from '@/constants/error.js';
import type { WalletConnectModalOpenProps } from '@/modals/WalletConnectModal/index.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/index.js';
import { SolanaNetworkType, useSolanaActiveNetworkStore } from '@/store/useSolanaActiveNetworkStore.js';

function getAppkitWalletAdapter() {
    if (!('solana' in CoreProviderController.state.providers)) throw new WalletNotConnectedError();
    const provider = CoreProviderController.state.providers.solana as Provider;
    if (!provider) throw new WalletNotConnectedError();
    return provider;
}

export function getWalletAdapter() {
    const activeNetwork = useSolanaActiveNetworkStore.getState().activeNetwork;
    switch (activeNetwork) {
        case SolanaNetworkType.Appkit:
            try {
                return getAppkitWalletAdapter();
            } catch {
                return PrivySolanaProvider;
            }
        case SolanaNetworkType.Privy:
            return PrivySolanaProvider.publicKey ? PrivySolanaProvider : getAppkitWalletAdapter();
        default:
            unreachable(activeNetwork);
    }
}

export function getWalletAdaptorConnected() {
    const provider = getWalletAdapter();
    if (!provider?.publicKey) throw new WalletNotConnectedError();
    return provider as Provider & { publicKey: web3.PublicKey };
}

export async function getWalletAdaptorRequired(openProps?: WalletConnectModalOpenProps & { silent?: boolean }) {
    try {
        return getWalletAdaptorConnected();
    } catch (error) {
        if (error instanceof WalletNotConnectedError) {
            const { silent, ...modalOptions } = openProps || {};
            if (silent) throw error;
            await WalletConnectModalRef.openAndWaitForClose({
                ...modalOptions,
                networkType: NetworkType.Solana,
            });
        } else {
            throw error;
        }
    }

    return getWalletAdaptorConnected();
}
