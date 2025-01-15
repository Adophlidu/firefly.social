/* cspell:disable */

import { web3 } from '@coral-xyz/anchor';
import { type SignerWalletAdapter, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { CoinbaseWalletAdapter, CoinbaseWalletName } from '@solana/wallet-adapter-coinbase';
import { PhantomWalletAdapter, PhantomWalletName } from '@solana/wallet-adapter-phantom';

import { getParticleSolanaProvider, ParticleSolanaWalletName } from '@/connectors/ParticleSolanaWallet.js';
import { UnreachableError } from '@/constants/error.js';
import { SOLANA_WALLET_CACHE_KEY } from '@/constants/index.js';
import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';
import { parseJSON } from '@/helpers/parseJSON.js';

const resolveSolanaWalletAdapter = createLookupTableResolver(
    {
        [PhantomWalletName]: new PhantomWalletAdapter(),
        [CoinbaseWalletName]: new CoinbaseWalletAdapter(),
    } as unknown as Record<string, SignerWalletAdapter>,
    (walletName: string) => {
        throw new UnreachableError('Solana wallet', walletName);
    },
);

export function getWalletAdapter() {
    const currentName = parseJSON<string>(localStorage.getItem(SOLANA_WALLET_CACHE_KEY));
    if (!currentName) throw new WalletNotConnectedError();

    // Phantom is a built-in wallet
    if (currentName === PhantomWalletName) {
        const phantom: { solana?: SignerWalletAdapter } = Reflect.get(window, 'phantom');
        if (!phantom?.solana) throw new WalletNotConnectedError();
        return phantom.solana;
    }

    if (currentName === ParticleSolanaWalletName) {
        const wallet = getParticleSolanaProvider();
        return wallet as unknown as SignerWalletAdapter;
    }

    const adapter = resolveSolanaWalletAdapter(currentName);
    if (!adapter) throw new WalletNotConnectedError();

    return adapter;
}

export function getWalletAdaptorConnected() {
    const adaptor = getWalletAdapter();
    if (!adaptor.publicKey) throw new WalletNotConnectedError();

    return adaptor as SignerWalletAdapter & { publicKey: web3.PublicKey };
}
