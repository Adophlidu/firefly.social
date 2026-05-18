import type { ActivitiesPlatform } from '@dimensiondev/enums';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createSelectors } from '@/helpers/createSelector.js';

export enum ActivitiesFilterNamespace {
    Profile = 'profile',
    Home = 'home',
}

interface FilterState {
    selectedPlatforms: Record<ActivitiesFilterNamespace, ActivitiesPlatform[]>;
    setSelectedPlatforms: (namespace: ActivitiesFilterNamespace, platform: ActivitiesPlatform[]) => void;
}

const useStateStore = create<FilterState, [['zustand/persist', unknown], ['zustand/immer', unknown]]>(
    persist(
        immer((set) => ({
            selectedPlatforms: {
                [ActivitiesFilterNamespace.Profile]: [],
                [ActivitiesFilterNamespace.Home]: [],
            },
            setSelectedPlatforms: (namespace, platforms) =>
                set((state) => {
                    state.selectedPlatforms[namespace] = platforms;
                }),
        })),
        {
            name: 'firefly-activities-filter',
            storage: createJSONStorage(() => localStorage),
        },
    ),
);

const useActivitiesFilterStoreBase = createSelectors(useStateStore);

export function useActivitiesFilterStore(namespace: ActivitiesFilterNamespace, excludes: ActivitiesPlatform[] = []) {
    const { selectedPlatforms, setSelectedPlatforms } = useActivitiesFilterStoreBase();

    return {
        selectedPlatforms: selectedPlatforms[namespace].filter((x) => !excludes.includes(x)),
        setSelectedPlatforms(platforms: ActivitiesPlatform[]) {
            setSelectedPlatforms(
                namespace,
                platforms.filter((x) => !excludes.includes(x)),
            );
        },
    };
}
