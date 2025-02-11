import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletConnectWalletAdapter } from '@solana/wallet-adapter-walletconnect';

import { env } from '@/constants/env.js';

export const walletConnectAdapter = new WalletConnectWalletAdapter({
    options: {
        projectId: env.external.NEXT_PUBLIC_W3M_PROJECT_ID,
    },
    network: WalletAdapterNetwork.Mainnet,
});
