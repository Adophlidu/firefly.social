'use client';

import type { web3 } from '@coral-xyz/anchor';
import { NetworkType } from '@dimensiondev/enums';
import { CoreProviderController } from '@reown/appkit';
import type { Provider } from '@reown/appkit-utils/solana';

import { WalletNotConnectedError } from '@/constants/error.js';
import { openAndWaitForCloseWalletConnectModal } from '@/helpers/openWalletConnectModal.js';
import type { WalletConnectModalOpenProps } from '@/modals/WalletConnectModal/refs.js';

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
            await openAndWaitForCloseWalletConnectModal({
                ...modalOptions,
                networkType: NetworkType.Solana,
            });
        } else {
            throw error;
        }
    }

    return getWalletAdaptorConnected();
}
