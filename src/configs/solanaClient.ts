import { type AppKitNetwork, solana } from '@reown/appkit/networks';
import { type BaseWalletAdapter, SolanaAdapter } from '@reown/appkit-adapter-solana/react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

import { PrivySolanaProvider, privySolanaWalletAdapter } from '@/connectors/PrivySolanaWalletAdapter.js';

export const solanaAdapter = new SolanaAdapter({
    wallets: [new PhantomWalletAdapter() as unknown as BaseWalletAdapter, privySolanaWalletAdapter],
}) as SolanaAdapter & {
    addConnector: (connector: BaseWalletAdapter) => void;
};

if ('addConnector' in solanaAdapter && typeof solanaAdapter.addConnector === 'function') {
    solanaAdapter.addConnector(PrivySolanaProvider);
}

export const solanaNetworks: AppKitNetwork[] = [solana];
