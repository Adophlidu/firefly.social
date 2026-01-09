import { uniq } from 'lodash-es';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { SORTED_BETS_PLATFORM } from '@/constants/computed.js';
import { type BetsPlatform } from '@/constants/enum.js';
import { createSelectors } from '@/helpers/createSelector.js';

export enum BetsFilterNamespace {
    Profile = 'profile',
    Discover = 'discover',
    Following = 'following',
}

interface FilterState {
    platforms: Record<BetsFilterNamespace, BetsPlatform[]>;
    setPlatforms: (namespace: BetsFilterNamespace, platforms: BetsPlatform[]) => void;
}

const useStateStore = create<FilterState, [['zustand/persist', unknown], ['zustand/immer', unknown]]>(
    persist(
        immer((set) => ({
            platforms: {
                [BetsFilterNamespace.Profile]: [],
                [BetsFilterNamespace.Following]: [],
                [BetsFilterNamespace.Discover]: [],
            },
            setPlatforms: (namespace, platforms) =>
                set((state) => {
                    state.platforms[namespace] = uniq(platforms);
                }),
        })),
        {
            name: 'firefly-bets-platform-filter',
            storage: createJSONStorage(() => sessionStorage),
        },
    ),
);

const useBetsSourceFilterStoreBase = createSelectors(useStateStore);

export function useBetsSourceFilterStore(namespace: BetsFilterNamespace) {
    const { platforms, setPlatforms } = useBetsSourceFilterStoreBase();
    const filteredPlatforms = useMemo(() => {
        const selectedPlatforms = SORTED_BETS_PLATFORM.filter((x) => platforms[namespace].includes(x));
        return selectedPlatforms.length === SORTED_BETS_PLATFORM.length ? [] : selectedPlatforms;
    }, [platforms, namespace]);

    return {
        platforms: filteredPlatforms,
        setPlatforms(platforms: BetsPlatform[]) {
            setPlatforms(namespace, platforms);
        },
    };
}
