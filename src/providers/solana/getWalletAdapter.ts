'use client';

import type { web3 } from '@coral-xyz/anchor';
import { ProviderUtil } from '@reown/appkit/store';
import type { Provider } from '@reown/appkit-adapter-solana';

import { PrivySolanaProvider } from '@/connectors/PrivySolanaWalletAdapter.js';
import { NetworkType } from '@/constants/enum.js';
import { unreachable } from '@/helpers/unreachable.js';
import type { WalletConnectModalOpenProps } from '@/modals/WalletConnectModal/index.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/index.js';
import { SolanaNetworkType, useSolanaActiveNetworkStore } from '@/store/useSolanaActiveNetworkStore.js';

export class WalletNotConnectedError extends Error {
    override name = 'WalletNotConnectedError';
}

export function getAppkitWalletAdapter() {
    if (!('solana' in ProviderUtil.state.providers)) throw new WalletNotConnectedError();
    const provider = ProviderUtil.state.providers.solana as Provider;
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

export async function getWalletAdaptorRequired(openProps?: WalletConnectModalOpenProps) {
    try {
        return getWalletAdaptorConnected();
    } catch (error) {
        if (error instanceof WalletNotConnectedError) {
            await WalletConnectModalRef.openAndWaitForClose({
                ...openProps,
                networkType: NetworkType.Solana,
            });
        } else {
            throw error;
        }
    }

    return getWalletAdaptorConnected();
}
