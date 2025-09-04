import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { ActivitiesPlatform } from '@/constants/enum.js';
import { createSelectors } from '@/helpers/createSelector.js';

export enum ActivitiesFilterNamespace {
    Profile = 'profile',
    Home = 'home',
}

interface FilterState {
    selectedPlatform: Record<ActivitiesFilterNamespace, ActivitiesPlatform | null>;
    setSelectedPlatform: (namespace: ActivitiesFilterNamespace, platform: ActivitiesPlatform | null) => void;
}

const useStateStore = create<FilterState, [['zustand/persist', unknown], ['zustand/immer', unknown]]>(
    persist(
        immer((set) => ({
            selectedPlatform: {
                [ActivitiesFilterNamespace.Profile]: null,
                [ActivitiesFilterNamespace.Home]: null,
            },
            setSelectedPlatform: (namespace, platform) =>
                set((state) => {
                    state.selectedPlatform[namespace] = platform;
                }),
        })),
        {
            name: 'firefly-activities-filter',
            storage: createJSONStorage(() => localStorage),
        },
    ),
);

const useActivitiesFilterStoreBase = createSelectors(useStateStore);

export function useActivitiesFilterStore(namespace: ActivitiesFilterNamespace, excludes?: ActivitiesPlatform[]) {
    const { selectedPlatform, setSelectedPlatform } = useActivitiesFilterStoreBase();

    const currentPlatform = selectedPlatform[namespace];

    return {
        selectedPlatform: currentPlatform && excludes?.includes(currentPlatform) ? null : currentPlatform,
        setSelectedPlatform(platform: ActivitiesPlatform | null) {
            if (platform && excludes?.includes(platform)) {
                setSelectedPlatform(namespace, null);
            } else {
                setSelectedPlatform(namespace, platform);
            }
        },
    };
}
