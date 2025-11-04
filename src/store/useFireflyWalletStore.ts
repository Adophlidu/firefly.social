import type { Address } from 'viem';
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
    wallets: Wallets;
    setWallet: <N extends NetworkType>(networkType: N, wallets: Wallets[N]) => void;
}

export const useFireflyWalletStore = create<FireflyWalletState, [['zustand/immer', never]]>(
    immer((set) => ({
        isAuthorized: false,
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
        setIsAuthorized(isAuthorized) {
            set((state) => {
                state.isAuthorized = isAuthorized;
            });
        },
    })),
);
