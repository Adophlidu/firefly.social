'use client';

import { bom } from '@dimensiondev/utils';

import { AsyncStatus } from '@/constants/enum.js';
import { createSelectors } from '@/helpers/createSelector.js';
import { getLensProfileByHandle } from '@/providers/lens/getLensProfileByHandle.js';
import { resumeLensSession } from '@/providers/lens/resumeLensSession.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { type Profile } from '@/providers/types/SocialMedia.js';
import { createProfileState, customSelectors } from '@/store/useProfileStore/createProfileState.js';

const state = createProfileState(
    {
        getUpdatedProfile: (profile: Profile) => getLensProfileByHandle(profile.handle),
        refreshCurrentAccountSession: () => lensSessionHolder.refreshSession(),
    },
    {
        name: 'lens-state',
        onRehydrateStorage: () => async (state) => {
            if (!bom.window || !state) return;

            state.upgrade();

            try {
                state.__setStatus__(AsyncStatus.Pending);
                await resumeLensSession(state.currentProfile?.profileId, () => {
                    state.clear();
                });
            } finally {
                state.__setStatus__(AsyncStatus.Idle);
            }
        },
    },
);

export const useLensProfileStore = createSelectors(state, customSelectors);
