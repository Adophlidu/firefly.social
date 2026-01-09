import { useAppKitProvider } from '@reown/appkit/react';
import { type Provider } from '@reown/appkit-adapter-solana';

export function useSolanaWalletProvider() {
    const { walletProvider } = useAppKitProvider<Provider | undefined>('solana');

    return walletProvider;
}
