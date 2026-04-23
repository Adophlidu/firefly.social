import { uniq } from 'lodash-es';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { SORTED_BETS_PLATFORM } from '@/constants/computed.js';
import type { PredictionPlatform } from '@/constants/enum.js';
import { createSelectors } from '@/helpers/createSelector.js';

export enum PredictionFilterNamespace {
    Profile = 'profile',
    Discover = 'discover',
    Following = 'following',
}

interface FilterState {
    platforms: Record<PredictionFilterNamespace, PredictionPlatform[]>;
    setPlatforms: (namespace: PredictionFilterNamespace, platforms: PredictionPlatform[]) => void;
}

const useStateStore = create<FilterState, [['zustand/persist', unknown], ['zustand/immer', unknown]]>(
    persist(
        immer((set) => ({
            platforms: {
                [PredictionFilterNamespace.Profile]: [],
                [PredictionFilterNamespace.Following]: [],
                [PredictionFilterNamespace.Discover]: [],
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

const usePredictionSourceFilterStoreBase = createSelectors(useStateStore);

export function usePredictionSourceFilterStore(namespace: PredictionFilterNamespace) {
    const { platforms, setPlatforms } = usePredictionSourceFilterStoreBase();
    const filteredPlatforms = useMemo(
        () => SORTED_BETS_PLATFORM.filter((x) => platforms[namespace].includes(x)),
        [platforms, namespace],
    );

    return {
        platforms: filteredPlatforms,
        setPlatforms(platforms: PredictionPlatform[]) {
            setPlatforms(namespace, platforms);
        },
    };
}
