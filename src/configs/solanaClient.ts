import { type AppKitNetwork, solana } from '@reown/appkit/networks';
import { type BaseWalletAdapter, SolanaAdapter } from '@reown/appkit-adapter-solana/react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

import { PrivySolanaWalletAdapter } from '@/connectors/PrivySolanaWalletAdapter.js';

const privySolanaWalletAdapter = new PrivySolanaWalletAdapter();

export const solanaAdapter = new SolanaAdapter({
    wallets: [new PhantomWalletAdapter() as unknown as BaseWalletAdapter, privySolanaWalletAdapter],
});

export const solanaNetworks: AppKitNetwork[] = [solana];
