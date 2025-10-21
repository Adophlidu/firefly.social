import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { HomeTab, type SocialSource } from '@/constants/enum.js';
import { createSelectors } from '@/helpers/createSelector.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';

interface DiscoverState {
    postTimelinePlatforms: Record<HomeTab, SocialSource[]>;
    setFilteredPlatform: (tab: HomeTab, source: SocialSource | SocialSource[]) => void;
    resetFilteredPlatform: (tab: HomeTab) => void;
}

const useDiscoverStoreBase = create<DiscoverState, [['zustand/persist', unknown], ['zustand/immer', never]]>(
    persist(
        immer((set, get) => ({
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

export function useDiscoverStoreWithTab(tab: HomeTab) {
    const { postTimelinePlatforms, setFilteredPlatform, resetFilteredPlatform } = useDiscoverStore();
    const profileAll = useCurrentProfilesAll();

    const selectedSources = useMemo(() => {
        if (tab !== HomeTab.Following) return postTimelinePlatforms[tab];

        return postTimelinePlatforms[tab].filter((source) => {
            return !!profileAll[source]?.profileId;
        });
    }, [postTimelinePlatforms, tab, profileAll]);

    return {
        selectedSources,
        setFilteredPlatform: (source: SocialSource | SocialSource[]) => setFilteredPlatform(tab, source),
        resetFilteredPlatform: () => resetFilteredPlatform(tab),
    };
}
