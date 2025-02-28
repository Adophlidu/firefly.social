import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createSelectors } from '@/helpers/createSelector.js';
import { getCurrentSourceFromUrl } from '@/helpers/getCurrentSourceFromUrl.js';
import type { FireflyIdentity, WalletProfile } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface FireflyIdentityState {
    identity: FireflyIdentity;
    setIdentity: (profileIdentity: FireflyIdentity) => void;

    profile: Profile | null;
    setProfile: (profile: Profile | null) => void;

    walletProfile: WalletProfile | null;
    setWalletProfile: (profile: WalletProfile | null) => void;
}

const useFireflyIdentityBase = create<FireflyIdentityState, [['zustand/persist', unknown], ['zustand/immer', never]]>(
    persist(
        immer((set) => ({
            identity: {
                id: '',
                source: getCurrentSourceFromUrl(),
            },
            setIdentity: (profileIdentity: FireflyIdentity) =>
                set((state) => {
                    state.identity = profileIdentity;
                }),
            profile: null,
            setProfile: (profile: Profile | null) =>
                set((state) => {
                    state.profile = profile;
                }),
            walletProfile: null,
            setWalletProfile: (profile: WalletProfile | null) =>
                set((state) => {
                    state.walletProfile = profile;
                }),
        })),
        {
            name: 'profile-tab-state',
            storage: createJSONStorage(() => localStorage),
        },
    ),
);

export const useFireflyIdentityState = createSelectors(useFireflyIdentityBase);
