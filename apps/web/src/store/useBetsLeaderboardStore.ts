import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { BetsLeaderboardTab } from '@/constants/enum.js';
import { createSelectors } from '@/helpers/createSelector.js';

interface BetsLeaderboardState {
    tab: BetsLeaderboardTab;
    setTab: (tab: BetsLeaderboardTab) => void;
}

const useStateStore = create<BetsLeaderboardState, [['zustand/immer', unknown]]>(
    immer((set) => ({
        tab: BetsLeaderboardTab.Global,
        setTab: (tab) => set({ tab }),
    })),
);

export const useBetsLeaderboardStore = createSelectors(useStateStore);
