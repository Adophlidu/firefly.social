import { safeUnreachable } from '@dimensiondev/utils';
import { useAppKitProvider } from '@reown/appkit/react';
import type { Provider } from '@reown/appkit-adapter-solana';
import { compact, first } from 'lodash-es';

import { PrivySolanaProvider } from '@/connectors/PrivySolanaWalletAdapter.js';
import { NetworkType } from '@/constants/enum.js';
import { usePrivyWalletStore } from '@/store/usePrivyWalletsStore.js';
import { SolanaNetworkType, useSolanaActiveNetworkStore } from '@/store/useSolanaActiveNetworkStore.js';

export function useSolanaWalletProvider() {
    const activeNetwork = useSolanaActiveNetworkStore((s) => s.activeNetwork);
    const { walletProvider } = useAppKitProvider<Provider | undefined>('solana');
    usePrivyWalletStore((state) => state.wallets[NetworkType.Solana]); // will rerender when privy wallet change
    switch (activeNetwork) {
        case SolanaNetworkType.Appkit:
            return first(compact([walletProvider, PrivySolanaProvider]));
        case SolanaNetworkType.Privy:
            return first(compact([PrivySolanaProvider.publicKey ? PrivySolanaProvider : undefined, walletProvider]));
        default:
            safeUnreachable(activeNetwork);
            return walletProvider;
    }
}
