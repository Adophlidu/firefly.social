import { type AppKitNetwork, solana } from '@reown/appkit/networks';
import { type AdapterOptions, SolanaAdapter } from '@reown/appkit-adapter-solana/react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

import { privySolanaProvider, privySolanaWalletAdapter } from '@/connectors/PrivySolanaWalletAdapter.js';

class SolanaAdapterWithPrivy extends SolanaAdapter {
    constructor(options: AdapterOptions) {
        super(options);

        this.addConnector(privySolanaProvider);
    }
}

export const solanaAdapter = new SolanaAdapterWithPrivy({
    wallets: [new PhantomWalletAdapter(), privySolanaWalletAdapter],
});

export const solanaNetworks = [solana] as AppKitNetwork[];
