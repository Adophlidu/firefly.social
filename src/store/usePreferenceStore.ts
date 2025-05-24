import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createSelectors } from '@/helpers/createSelector.js';
import type { SearchTokenInfo } from '@/providers/types/Firefly.js';

/** critical data to identify a coin */
export type StoredCoinInfo = Pick<SearchTokenInfo, 'id' | 'chain' | 'contract_address'>;

interface Preferences {
    SHOW_SCHEDULE_POST_TIP: boolean;
    SHOW_USER_TX_IN_CHART: boolean;
    SHOW_TRUTH_SOCIAL: boolean;
    SHOW_TRUTH_SOCIAL_ALERT: boolean;
    TOKEN_PROFILE_COIN_ID_MAP: Record<string, StoredCoinInfo>;
}

const defaultPreferences: Preferences = {
    SHOW_SCHEDULE_POST_TIP: true,
    SHOW_USER_TX_IN_CHART: true,
    SHOW_TRUTH_SOCIAL: true,
    SHOW_TRUTH_SOCIAL_ALERT: true,
    TOKEN_PROFILE_COIN_ID_MAP: {},
};

export interface PreferencesState {
    preferences: Preferences;
    getPreference<T extends keyof Preferences>(key: T): Preferences[T];
    setPreference<T extends keyof Preferences>(
        key: T,
        value: Preferences[T] | ((prevValue: Preferences[T]) => Preferences[T]),
    ): void;
    resetPreferences(): void;
}

const PreferencesState = create<PreferencesState, [['zustand/persist', unknown], ['zustand/immer', unknown]]>(
    persist(
        immer<PreferencesState>((set, get) => ({
            preferences: defaultPreferences,
            getPreference(key) {
                return get().preferences[key];
            },
            setPreference(key, value) {
                return set((state) => {
                    state.preferences[key] = typeof value === 'function' ? value(state.preferences[key]) : value;
                });
            },
            resetPreferences() {
                return set((state) => {
                    state.preferences = defaultPreferences;
                });
            },
        })),
        {
            name: 'firefly-preferences',
            storage: createJSONStorage(() => localStorage),
        },
    ),
);

export const usePreferencesState = createSelectors(PreferencesState);
