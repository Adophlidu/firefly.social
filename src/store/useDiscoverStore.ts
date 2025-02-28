import { uniq } from 'lodash-es';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { SocialSource } from '@/constants/enum.js';

interface DiscoverState {
    filteredPlatforms: SocialSource[];
    enabledFilterPlatform: boolean;

    setFilteredPlatform: (source: SocialSource, filter: boolean) => void;
    setEnabledFilteredPlatform: (enabled: boolean) => void;
    toggleEnabledFilteredPlatform: (enabled: boolean) => void;
}

export const useDiscoverStore = create<DiscoverState, [['zustand/persist', unknown], ['zustand/immer', never]]>(
    persist(
        immer((set, get) => ({
            filteredPlatforms: [],
            enabledFilterPlatform: false,
            setFilteredPlatform(source, filtered: boolean) {
                set((state) => {
                    if (filtered) {
                        state.filteredPlatforms = state.filteredPlatforms.filter((x) => x !== source);
                    } else {
                        state.filteredPlatforms = uniq([...state.filteredPlatforms, source]);
                    }
                });
            },
            setEnabledFilteredPlatform(enabled) {
                set((state) => {
                    state.enabledFilterPlatform = enabled;
                });
            },
            toggleEnabledFilteredPlatform() {
                set((state) => {
                    state.enabledFilterPlatform = !state.enabledFilterPlatform;
                });
            },
        })),
        {
            name: 'discover-state',
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
