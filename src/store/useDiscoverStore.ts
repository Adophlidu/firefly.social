import { uniq } from 'lodash-es';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { SocialSource } from '@/constants/enum.js';

interface DiscoverState {
    filteredPlatforms: SocialSource[];
    setFilteredPlatform: (source: SocialSource, filter: boolean) => void;
}

export const useDiscoverStore = create<DiscoverState, [['zustand/persist', unknown], ['zustand/immer', never]]>(
    persist(
        immer((set, get) => ({
            filteredPlatforms: [],
            setFilteredPlatform(source, filtered: boolean) {
                set((state) => {
                    if (filtered) {
                        state.filteredPlatforms = state.filteredPlatforms.filter((x) => x !== source);
                    } else {
                        state.filteredPlatforms = uniq([...state.filteredPlatforms, source]);
                    }
                });
            },
        })),
        {
            name: 'discover-state',
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
