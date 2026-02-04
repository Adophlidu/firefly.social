'use client';

import { bom } from '@dimensiondev/utils';
import { jwtDecode } from 'jwt-decode';

import { AsyncStatus, Source } from '@/constants/enum.js';
import { FetchError } from '@/constants/error.js';
import { createSelectors } from '@/helpers/createSelector.js';
import { runInSafe } from '@/helpers/runInSafe.js';
import { logger } from '@/libs/Logger.js';
import { getBskyProfileById } from '@/providers/bsky/getBskyProfileById.js';
import { type BskySession } from '@/providers/bsky/Session.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { captureException, ExceptionId } from '@/providers/errorCapture/captureException.js';
import { type Profile } from '@/providers/types/SocialMedia.js';
import { ensureProfileSessionInStore } from '@/services/ensureProfileSessionInStore.js';
import { createProfileState, customSelectors } from '@/store/useProfileStore/createProfileState.js';

const state = createProfileState(
    {
        getUpdatedProfile: (profile: Profile) => getBskyProfileById(profile.profileId),
    },
    {
        name: 'bsky-state',
        onRehydrateStorage: () => async (state) => {
            if (!bom.window || !state) return;

            state.upgrade();

            try {
                state.__setStatus__(AsyncStatus.Pending);
                await ensureProfileSessionInStore(Source.Bsky, state);

                const bskySession = state.currentProfileSession as BskySession | null;
                if (bskySession) {
                    await bskySessionHolder.resumeSession(bskySession);
                }
            } catch (error) {
                logger.error(`[bsky store] error occurs when restore profile store ${error}`);
                if (error instanceof FetchError) return;

                const bskySession = state.currentProfileSession as BskySession | null;
                if (!bskySession) return;

                captureException(ExceptionId.RESUME_BSKY_SESSION, error, {
                    profileId: bskySession.did,
                    now: Date.now().toString(),
                    accessTokenExp: runInSafe(() => jwtDecode(bskySession.sessionPayload.accessJwt)?.exp) || '',
                    refreshTokenExp: runInSafe(() => jwtDecode(bskySession.sessionPayload.refreshJwt)?.exp) || '',
                });
            } finally {
                state.__setStatus__(AsyncStatus.Idle);
            }
        },
    },
);

export const useBskyProfileStore = createSelectors(state, customSelectors);
