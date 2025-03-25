import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createSelectors } from '@/helpers/createSelector.js';

interface SwapState {
    selectedChainId: number | null;
    setSelectedChainId: (chainId: number | null) => void;
}

export const useSwapStore = create<SwapState, [['zustand/persist', unknown], ['zustand/immer', unknown]]>(
    persist(
        immer((set) => ({
            selectedChainId: null,
            setSelectedChainId: (chainId) => set({ selectedChainId: chainId }),
        })),
        {
            name: 'firefly-swap',
            storage: createJSONStorage(() => localStorage),
        },
    ),
);

export const useSwapStateStore = createSelectors(useSwapStore);
