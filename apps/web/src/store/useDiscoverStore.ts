import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { HomeTab, type SocialSource } from '@/constants/enum.js';
import { createSelectors } from '@/helpers/createSelector.js';

interface DiscoverState {
    postTimelinePlatforms: Record<HomeTab, SocialSource[]>;
    setFilteredPlatform: (tab: HomeTab, source: SocialSource | SocialSource[]) => void;
    resetFilteredPlatform: (tab: HomeTab) => void;
}

const useDiscoverStoreBase = create<DiscoverState, [['zustand/persist', unknown], ['zustand/immer', never]]>(
    persist(
        immer((set) => ({
            postTimelinePlatforms: {
                [HomeTab.Discover]: [],
                [HomeTab.Following]: [],
            },
            setFilteredPlatform(tab, source) {
                set((state) => {
                    state.postTimelinePlatforms[tab] = Array.isArray(source) ? source : [source];
                });
            },
            resetFilteredPlatform(tab) {
                set((state) => {
                    state.postTimelinePlatforms[tab] = [];
                });
            },
        })),
        {
            name: 'discover-state',
            storage: createJSONStorage(() => localStorage),
        },
    ),
);

export const useDiscoverStore = createSelectors(useDiscoverStoreBase);
