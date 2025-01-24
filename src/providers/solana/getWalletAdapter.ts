/* cspell:disable */

import { web3 } from '@coral-xyz/anchor';
import { type SignerWalletAdapter, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { WalletConnectWalletName } from '@solana/wallet-adapter-walletconnect';

import { walletConnectAdapter } from '@/configs/solanaWallets.js';
import { getParticleSolanaProvider } from '@/connectors/ParticleSolanaWallet.js';
import { SolanaWalletName } from '@/constants/enum.js';
import { SOLANA_WALLET_CACHE_KEY } from '@/constants/index.js';
import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';
import { parseJSON } from '@/helpers/parseJSON.js';

const resolveSolanaWalletAdapter = createLookupTableResolver(
    {
        [WalletConnectWalletName]: walletConnectAdapter,
    } as unknown as Record<string, SignerWalletAdapter>,
    (walletName: string) => {
        throw new Error(`Unsupported solana wallet: ${walletName}`);
    },
);

export function getWalletAdapter() {
    const currentName = parseJSON<string>(localStorage.getItem(SOLANA_WALLET_CACHE_KEY));
    if (!currentName) throw new WalletNotConnectedError();

    switch (currentName) {
        case SolanaWalletName.Phantom: // built-in
            const phantom: { solana?: SignerWalletAdapter } = Reflect.get(window, 'phantom');
            if (!phantom?.solana) throw new WalletNotConnectedError();
            return phantom.solana;
        case SolanaWalletName.Particle: // built-in
            const wallet = getParticleSolanaProvider();
            return wallet as unknown as SignerWalletAdapter;
        case SolanaWalletName.Okx: // built-in
            const okx: { solana?: SignerWalletAdapter } = Reflect.get(window, 'okxwallet');
            if (!okx?.solana) throw new WalletNotConnectedError();
            return okx.solana;
        case SolanaWalletName.Solflare: // built-in
            const solflare: SignerWalletAdapter | undefined = Reflect.get(window, 'solflare');
            if (!solflare) throw new WalletNotConnectedError();
            return solflare;
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
