import { EMPTY_LIST } from '@dimensiondev/constants';
import { type Address } from 'viem';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { NetworkType } from '@/constants/enum.js';

interface Wallets {
    [NetworkType.Solana]: Array<{ address: string }>;
    [NetworkType.Ethereum]: Array<{ address: Address }>;
}

interface FireflyWalletState {
    isAuthorized: boolean;
    setIsAuthorized: (isAuthorized: boolean) => void;
    isConnected: boolean;
    setIsConnected: (isConnected: boolean) => void;
    wallets: Wallets;
    setWallet: <N extends NetworkType>(networkType: N, wallets: Wallets[N]) => void;
}

export const useFireflyWalletStore = create<FireflyWalletState, [['zustand/immer', never]]>(
    immer((set) => ({
        isAuthorized: false,
        isConnected: false,
        wallets: {
            [NetworkType.Solana]: EMPTY_LIST,
            [NetworkType.Ethereum]: EMPTY_LIST,
        },
        setWallet(networkType, wallets) {
            set((state) => {
                // Avoid Immer's deep-writable draft incompatibility with readonly fields inside Privy wallet types
                state.wallets[networkType] = wallets as never;
            });
        },
        setIsAuthorized(isAuthorized) {
            set((state) => {
                state.isAuthorized = isAuthorized;
            });
        },
        setIsConnected(isConnected) {
            set((state) => {
                state.isConnected = isConnected;
            });
        },
    })),
);
