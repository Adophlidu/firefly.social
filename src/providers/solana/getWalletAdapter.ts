import type { web3 } from '@coral-xyz/anchor';
import { ProviderUtil } from '@reown/appkit/store';
import type { Provider } from '@reown/appkit-adapter-solana';

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
