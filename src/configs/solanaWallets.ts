import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletConnectWalletAdapter } from '@solana/wallet-adapter-walletconnect';

import { ParticleSolanaWalletAdapter } from '@/connectors/ParticleSolanaWallet.js';
import { env } from '@/constants/env.js';

export const particleAdapter = new ParticleSolanaWalletAdapter();
export const walletConnectAdapter = new WalletConnectWalletAdapter({
    options: {
        projectId: env.external.NEXT_PUBLIC_W3M_PROJECT_ID,
    },
    network: WalletAdapterNetwork.Mainnet,
});
