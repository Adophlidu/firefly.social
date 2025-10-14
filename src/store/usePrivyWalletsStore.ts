import type { ConnectedWallet } from '@privy-io/react-auth';
import { ConnectedStandardSolanaWallet as ConnectedSolanaWallet } from '@privy-io/react-auth/solana';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { NetworkType } from '@/constants/enum.js';

interface usePrivyWalletStoreState {
    ready: boolean;
    authenticated: boolean;
    setReady: (ready: boolean) => void;
    setAuthenticated: (authenticated: boolean) => void;
    wallets: {
        [NetworkType.Solana]: ConnectedSolanaWallet[];
        [NetworkType.Ethereum]: ConnectedWallet[];
    };
    setWallet: <N extends NetworkType>(
        networkType: N,
        wallets: {
            [NetworkType.Solana]: ConnectedSolanaWallet[];
            [NetworkType.Ethereum]: ConnectedWallet[];
        }[N],
    ) => void;
}

export const usePrivyWalletStore = create<usePrivyWalletStoreState, [['zustand/immer', never]]>(
    immer((set) => ({
        ready: false,
        authenticated: false,
        setReady(ready: boolean) {
            set((state) => {
                state.ready = ready;
            });
        },
        setAuthenticated(ready: boolean) {
            set((state) => {
                state.authenticated = ready;
            });
        },
        wallets: {
            [NetworkType.Solana]: [],
            [NetworkType.Ethereum]: [],
        },
        setWallet(networkType, wallets) {
            set((state) => {
                // Avoid Immer's deep-writable draft incompatibility with readonly fields inside Privy wallet types
                state.wallets[networkType] = wallets as never;
            });
        },
    })),
);
