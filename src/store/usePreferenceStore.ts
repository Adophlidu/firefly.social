import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { NotificationSourceType } from '@/constants/enum.js';
import { createSelectors } from '@/helpers/createSelector.js';
import type { SearchTokenInfo } from '@/providers/types/Firefly.js';

/** critical data to identify a coin */
type StoredCoinInfo = Pick<SearchTokenInfo, 'id' | 'chain' | 'contract_address'>;

interface Preferences {
    SHOW_SCHEDULE_POST_TIP: boolean;
    SHOW_TRUTH_SOCIAL: boolean;
    SHOW_TRUTH_SOCIAL_ALERT: boolean;
    TOKEN_PROFILE_COIN_ID_MAP: Record<string, StoredCoinInfo>;
    FIREFLY_ACCOUNT_CHECKED_MAP: Record<string, boolean>;
    NOTIFICATION_READ_RECORD: Record<
        NotificationSourceType,
        Array<{
            profileId: string;
            latestNotificationId: string | null;
            hasNewNotification: boolean;
            isActive: boolean;
        }>
    >;
}

const defaultPreferences: Preferences = {
    SHOW_SCHEDULE_POST_TIP: true,
    SHOW_TRUTH_SOCIAL: true,
    SHOW_TRUTH_SOCIAL_ALERT: true,
    TOKEN_PROFILE_COIN_ID_MAP: {},
    FIREFLY_ACCOUNT_CHECKED_MAP: {},
    NOTIFICATION_READ_RECORD: {
        [NotificationSourceType.Tips]: [],
        [NotificationSourceType.Schedule]: [],
        [NotificationSourceType.Farcaster]: [],
        [NotificationSourceType.Lens]: [],
        [NotificationSourceType.Bsky]: [],
    },
};

const STORE_VERSION = 2;

interface PreferencesState {
    rehydrating: boolean;
    preferences: Preferences;
    setHasHydrated(): void;
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
            rehydrating: true,
            preferences: defaultPreferences,
            setHasHydrated() {
                return set((state) => {
                    state.rehydrating = false;
                });
            },
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
            version: STORE_VERSION,
            storage: createJSONStorage(() => localStorage),
            migrate: (persistedState, version) => {
                if (version !== STORE_VERSION) {
                    const oldState = persistedState as Partial<PreferencesState> | undefined;
                    const oldPreferences = oldState?.preferences;
                    return {
                        preferences: {
                            ...oldPreferences,
                            TOKEN_PROFILE_COIN_ID_MAP: oldPreferences?.TOKEN_PROFILE_COIN_ID_MAP || {},
                            FIREFLY_ACCOUNT_CHECKED_MAP: oldPreferences?.FIREFLY_ACCOUNT_CHECKED_MAP || {},
                            NOTIFICATION_READ_RECORD: defaultPreferences.NOTIFICATION_READ_RECORD,
                        } as Preferences, // Reset to default preferences if version mismatch
                    };
                }
                return persistedState;
            },
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated();
            },
        },
    ),
);

export const usePreferencesState = createSelectors(PreferencesState);
