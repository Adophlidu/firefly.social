'use client';

import { bom } from '@dimensiondev/utils';

import { AsyncStatus } from '@/constants/enum.js';
import { createSelectors } from '@/helpers/createSelector.js';
import { getFarcasterProfileById } from '@/providers/farcaster/getFarcasterProfileById.js';
import { type FarcasterSession } from '@/providers/farcaster/Session.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { type Profile } from '@/providers/types/SocialMedia.js';
import { createProfileState, customSelectors } from '@/store/useProfileStore/createProfileState.js';

const state = createProfileState(
    {
        getUpdatedProfile: (profile: Profile) => getFarcasterProfileById(profile.profileId),
    },
    {
        name: 'farcaster-state',
        onRehydrateStorage: () => async (state) => {
            if (!bom.window || !state) return;

            state.upgrade();

            try {
                if (state.currentProfileSession) {
                    const farcasterSession = state.currentProfileSession as FarcasterSession;
                    farcasterSessionHolder.resumeSession(farcasterSession);
                }
                if (state.currentProfile && state.currentProfile.isProUser === undefined) {
                    await state.refreshCurrentAccount();
                }
            } finally {
                state.__setStatus__(AsyncStatus.Idle);
            }
        },
    },
);

export const useFarcasterProfileStore = createSelectors(state, customSelectors);
