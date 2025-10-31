'use client';
import { bom } from '@firefly/utils';
import { t } from '@lingui/core/macro';
import { jwtDecode } from 'jwt-decode';

import { sentryClient } from '@/configs/sentryClient.js';
import { AsyncStatus } from '@/constants/enum.js';
import { BskySessionExpiredError, FetchError } from '@/constants/error.js';
import { createSelectors } from '@/helpers/createSelector.js';
import { enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { runInSafe } from '@/helpers/runInSafe.js';
import { getBskySessionStorage, removeBskySessionStorage } from '@/providers/bsky/createBskyAgent.js';
import { isBskyTokenExpired } from '@/providers/bsky/isBskyTokenExpired.js';
import { retryOnBskyWhenNetworkError } from '@/providers/bsky/retryOnBskyWhenNetworkError.js';
import type { BskySession } from '@/providers/bsky/Session.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { BskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import { type Profile } from '@/providers/types/SocialMedia.js';
import { ExceptionId } from '@/providers/types/Telemetry.js';
import { createProfileState, customSelectors } from '@/store/useProfileStore/createProfileState.js';

const state = createProfileState(
    {
        getUpdatedProfile: (profile: Profile) => BskySocialMediaProvider.getProfileById(profile.profileId),
    },
    {
        name: 'bsky-state',
        onRehydrateStorage: () => async (state) => {
            if (!bom.window || !state) return;

            state.upgrade();

            const did = state.currentProfile?.profileId;
            const currentProfileSession = state.currentProfileSession;
            if (!currentProfileSession) {
                console.warn('[bsky store] clean the local store because did or session is missing');
                state.clear();
                state.__setStatus__(AsyncStatus.Idle);
                return;
            }
            const bskySession = currentProfileSession as BskySession;
            const sdkSession = getBskySessionStorage()?.[bskySession.did];
            if (sdkSession?.accessJwt && sdkSession.refreshJwt) {
                bskySession.sessionPayload = {
                    ...bskySession.sessionPayload,
                    accessJwt: sdkSession.accessJwt,
                    refreshJwt: sdkSession.refreshJwt,
                };
            }

            try {
                state.__setStatus__(AsyncStatus.Pending);

                if (isBskyTokenExpired(bskySession.sessionPayload.refreshJwt, 1000 * 60 * 5)) {
                    console.warn('[bsky store] clean the local store because refresh jwt is expired');
                    state.clear();
                    return;
                }

                if (did && did !== bskySession.did) {
                    console.warn('[bsky store] clean the local store because did is not matched');
                    state.clear();
                    return;
                }

                await bskySessionHolder.resumeSession(bskySession, false);

                const profile = await retryOnBskyWhenNetworkError(3, () =>
                    BskySocialMediaProvider.getProfileById(bskySession.did),
                );
                const newSession = bskySessionHolder.session ?? bskySession;
                newSession.sessionPayload = {
                    ...newSession.sessionPayload,
                    ...(bskySessionHolder.agent.sessionManager.session || {}),
                };

                if (!did) {
                    state.addAccount(
                        {
                            profile,
                            session: newSession,
                        },
                        true,
                    );
                } else {
                    state.updateCurrentAccount({ profile, session: newSession });
                }
            } catch (error) {
                console.error(`[bsky store] error occurs when restore profile store ${error}`);

                if (error instanceof FetchError) return;
                console.warn('[bsky store] clean the local store because of the error', error);

                const clearSession = error instanceof BskySessionExpiredError;
                if (clearSession) {
                    removeBskySessionStorage(bskySession.did);
                }

                state.clear(clearSession);
                bskySessionHolder.removeSession();

                if (state.currentProfileSession) {
                    enqueueWarningMessage(
                        clearSession
                            ? t`Your Bluesky session has expired, please sign in again`
                            : t`Failed to restore your Bluesky session, you can refresh the page to try again or sign in again.`,
                    );
                }

                sentryClient.captureException(ExceptionId.RESUME_BSKY_SESSION, error, {
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
