/* cspell:disable */

import { web3 } from '@coral-xyz/anchor';
import { type SignerWalletAdapter, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { PhantomWalletName } from '@solana/wallet-adapter-phantom';
import { WalletConnectWalletName } from '@solana/wallet-adapter-walletconnect';

import { walletConnectAdapter } from '@/configs/solanaWallets.js';
import { getParticleSolanaProvider, ParticleSolanaWalletName } from '@/connectors/ParticleSolanaWallet.js';
import { UnreachableError } from '@/constants/error.js';
import { SOLANA_WALLET_CACHE_KEY } from '@/constants/index.js';
import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';
import { parseJSON } from '@/helpers/parseJSON.js';

const resolveSolanaWalletAdapter = createLookupTableResolver(
    {
        [WalletConnectWalletName]: walletConnectAdapter,
    } as unknown as Record<string, SignerWalletAdapter>,
    (walletName: string) => {
        throw new UnreachableError('Solana wallet', walletName);
    },
);

export function getWalletAdapter() {
    const currentName = parseJSON<string>(localStorage.getItem(SOLANA_WALLET_CACHE_KEY));
    if (!currentName) throw new WalletNotConnectedError();

    switch (currentName) {
        case PhantomWalletName: // built-in
            const phantom: { solana?: SignerWalletAdapter } = Reflect.get(window, 'phantom');
            if (!phantom?.solana) throw new WalletNotConnectedError();
            return phantom.solana;
        case ParticleSolanaWalletName: // built-in
            const wallet = getParticleSolanaProvider();
            return wallet as unknown as SignerWalletAdapter;
        case 'OKX Wallet': // built-in
            const okx: { solana?: SignerWalletAdapter } = Reflect.get(window, 'okxwallet');
            if (!okx?.solana) throw new WalletNotConnectedError();
            return okx.solana;
        default:
            const adapter = resolveSolanaWalletAdapter(currentName);
            if (!adapter) throw new WalletNotConnectedError();
            return adapter;
    }
}

export function getWalletAdaptorConnected() {
    const adaptor = getWalletAdapter();
    if (!adaptor.publicKey) throw new WalletNotConnectedError();

    return adaptor as SignerWalletAdapter & { publicKey: web3.PublicKey };
}
