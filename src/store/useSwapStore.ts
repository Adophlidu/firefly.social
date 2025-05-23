import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createSelectors } from '@/helpers/createSelector.js';

interface SwapState {
    hasOpenSwap: boolean;
    setHasOpenSwap: (hasOpenSwap: boolean) => void;
    selectedChainId: number | null;
    setSelectedChainId: (chainId: number | null) => void;
}

const useSwapStore = create<SwapState, [['zustand/persist', unknown], ['zustand/immer', unknown]]>(
    persist(
        immer((set) => ({
            hasOpenSwap: false,
            setHasOpenSwap: (hasOpenSwap) => set({ hasOpenSwap }),
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
