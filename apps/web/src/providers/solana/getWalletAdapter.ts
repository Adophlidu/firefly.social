'use client';

import type { web3 } from '@coral-xyz/anchor';
import { CoreProviderController } from '@reown/appkit';
import type { Provider } from '@reown/appkit-adapter-solana';

import { NetworkType } from '@/constants/enum.js';
import { WalletNotConnectedError } from '@/constants/error.js';
import { type WalletConnectModalOpenProps, WalletConnectModalRef } from '@/modals/WalletConnectModal/refs.js';

export function getWalletAdapter() {
    if (!('solana' in CoreProviderController.state.providers)) throw new WalletNotConnectedError();
    const provider = CoreProviderController.state.providers.solana as Provider;
    if (!provider) throw new WalletNotConnectedError();
    return provider;
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
