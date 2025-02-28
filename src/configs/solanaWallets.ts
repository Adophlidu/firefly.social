import { type AppKitNetwork, solana } from '@reown/appkit/networks';
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

export const solanaAdapter = new SolanaAdapter({
    wallets: [new PhantomWalletAdapter()],
});

export const solanaNetworks: AppKitNetwork[] = [solana];
