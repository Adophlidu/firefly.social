import { type AppKitNetwork, solana } from '@reown/appkit/networks';
import { createAppKit } from '@reown/appkit/react';
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

import { env } from '@/constants/env.js';

const solanaAdapter = new SolanaAdapter({
    wallets: [new PhantomWalletAdapter()],
});

const networks = [solana] as [AppKitNetwork, ...AppKitNetwork[]];

export const appkit = createAppKit({
    adapters: [solanaAdapter],
    networks,
    projectId: env.external.NEXT_PUBLIC_W3M_PROJECT_ID,
    showWallets: false,
    features: {
        email: false,
        socials: [],
    },
});
