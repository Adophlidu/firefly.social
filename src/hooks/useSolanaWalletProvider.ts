import { safeUnreachable } from '@masknet/kit';
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { useAppKitProvider } from '@reown/appkit/react';
import type { Provider } from '@reown/appkit-adapter-solana';

import { PrivySolanaProvider } from '@/connectors/PrivySolanaWalletAdapter.js';
import { SolanaNetworkType, useSolanaActiveNetworkStore } from '@/store/useSolanaActiveNetworkStore.js';

export function useSolanaWalletProvider() {
    const activeNetwork = useSolanaActiveNetworkStore((s) => s.activeNetwork);
    const { walletProvider } = useAppKitProvider<Provider | undefined>('solana');
    useSolanaWallets(); // will rerender when privy wallet change
    switch (activeNetwork) {
        case SolanaNetworkType.Appkit:
            return walletProvider;
        case SolanaNetworkType.Privy:
            return PrivySolanaProvider;
        default:
            safeUnreachable(activeNetwork);
            return walletProvider;
    }
}
