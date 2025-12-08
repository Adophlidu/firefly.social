'use client';

import { bom } from '@dimensiondev/utils';

import { AsyncStatus, Source } from '@/constants/enum.js';
import { createSelectors } from '@/helpers/createSelector.js';
import { getLensProfileByHandle } from '@/providers/lens/getLensProfileByHandle.js';
import type { LensSession } from '@/providers/lens/Session.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { type Profile } from '@/providers/types/SocialMedia.js';
import { ensureProfileSessionInStore } from '@/services/ensureProfileSessionInStore.js';
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
                await ensureProfileSessionInStore(Source.Lens, state);

                const currentSession = state.currentProfileSession as LensSession | null;
                if (currentSession) {
                    await lensSessionHolder.resumeSession(currentSession);
                }
            } finally {
                state.__setStatus__(AsyncStatus.Idle);
            }
        },
    },
);

export const useLensProfileStore = createSelectors(state, customSelectors);
