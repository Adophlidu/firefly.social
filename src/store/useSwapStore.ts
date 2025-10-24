import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { createSelectors } from '@/helpers/createSelector.js';
import type { SwapModalOpenProps } from '@/modals/SwapModal/SwapModalContent.js';

export interface SwapState {
    sidebarSwapReady: boolean;
    sidebarSwapOptions: SwapModalOpenProps | undefined;
    setSidebarSwapReady: (ready: boolean) => void;
    setSidebarSwapOptions: (options: SwapModalOpenProps | undefined) => void;
}

const SwapState = create<SwapState, [['zustand/immer', unknown]]>(
    immer<SwapState>((set) => ({
        sidebarSwapReady: true,
        sidebarSwapOptions: undefined,
        setSidebarSwapReady: (ready) => {
            set({
                sidebarSwapReady: ready,
            });
        },
        setSidebarSwapOptions(options) {
            set({
                sidebarSwapOptions: options,
            });
        },
    })),
);

export const useSwapStore = createSelectors(SwapState);
