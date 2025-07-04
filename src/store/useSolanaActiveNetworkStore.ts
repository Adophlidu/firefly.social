import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export enum SolanaNetworkType {
    Appkit = 'appkit',
    Privy = 'privy-solana',
}

interface SolanaActiveNetworkState {
    activeNetwork: SolanaNetworkType;
    setActiveNetwork: (network: SolanaNetworkType) => void;
}

export const useSolanaActiveNetworkStore = create<
    SolanaActiveNetworkState,
    [['zustand/persist', unknown], ['zustand/immer', never]]
>(
    persist(
        immer((set) => ({
            activeNetwork: SolanaNetworkType.Appkit,
            setActiveNetwork: (network: SolanaNetworkType) => {
                set((state) => {
                    state.activeNetwork = network;
                });
            },
        })),
        {
            storage: createJSONStorage(() => localStorage),
            name: 'solana-active-network',
        },
    ),
);
