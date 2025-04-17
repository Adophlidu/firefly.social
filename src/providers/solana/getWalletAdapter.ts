import type { web3 } from '@coral-xyz/anchor';
import { ProviderUtil } from '@reown/appkit/store';
import type { Provider } from '@reown/appkit-adapter-solana';

import { NetworkType } from '@/constants/enum.js';
import { WalletConnectModalRef } from '@/modals/controls.js';
import type { WalletConnectModalOpenProps } from '@/modals/WalletConnectModal/index.js';

export class WalletNotConnectedError extends Error {
    override name = 'WalletNotConnectedError';
}

export function getWalletAdapter() {
    if (!('solana' in ProviderUtil.state.providers)) throw new WalletNotConnectedError();
    const provider = ProviderUtil.state.providers.solana as Provider;
    if (!provider) throw new WalletNotConnectedError();
    return provider;
}

export function getWalletAdaptorConnected() {
    if (!('solana' in ProviderUtil.state.providers)) throw new WalletNotConnectedError();
    const provider = ProviderUtil.state.providers.solana as Provider;
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
