'use client';

import { AuthenticationError, bom, ForbiddenError } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import dayjs from 'dayjs';
import { getSession, signOut } from 'next-auth/react';

import { AsyncStatus } from '@/constants/enum.js';
import { FetchError, FireflyAlreadyBoundError } from '@/constants/error.js';
import { HIDDEN_SECRET } from '@/constants/static.js';
import { createSelectors } from '@/helpers/createSelector.js';
import { enqueueForbiddenMessage, enqueueMessageFromError, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { addTwitterAccount } from '@/providers/twitter/addTwitterAccount.js';
import { TwitterAuthProvider } from '@/providers/twitter/Auth.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { createProfileState, customSelectors } from '@/store/useProfileStore/createProfileState.js';

interface TwitterNextSession {
    expires: string;
    token: {
        createdAt: number;
        expiresAt: number;
    };
    type: SessionType.Twitter;
    user?: {
        email: string;
        id: string;
        image: string;
        name: string;
    };
}

const state = createProfileState(
    {},
    {
        name: 'twitter-state',
        onRehydrateStorage: () => async (state) => {
            if (!bom.window || !state || bom.location?.pathname.includes('/telegram/login')) return;

            state.upgrade();

            try {
                const currentSession = state.currentProfileSession as TwitterSession | null;
                // clean the local store if the consumer secret is not hidden
                if (currentSession?.payload.consumerSecret && currentSession.payload.consumerSecret !== HIDDEN_SECRET) {
                    state.clear();
                    return;
                }

                const OAuthSession = (
                    currentSession ? null : await runInSafeAsync(() => getSession())
                ) as TwitterNextSession | null;
                const idFromSession = OAuthSession?.type === SessionType.Twitter ? OAuthSession?.user?.id : undefined;
                const createdAt = dayjs((OAuthSession?.token.createdAt || 0) * 1000);
                const isNewLogin =
                    !!idFromSession &&
                    !state.accounts.some((x) => x.session.profileId === idFromSession) &&
                    dayjs().diff(createdAt, 'minute') < 5;

                // resume the session if it exists
                if (currentSession && !isNewLogin) twitterSessionHolder.resumeSession(currentSession);

                // no remote session found
                const sessionPayload = await TwitterAuthProvider.login(isNewLogin);
                if (!sessionPayload) {
                    state.clear();
                    twitterSessionHolder.removeSession();
                    return;
                }

                // show indicator if the session is from the server
                state.__setStatus__(AsyncStatus.Pending);

                await addTwitterAccount(sessionPayload, isNewLogin);
                twitterSessionHolder.resumeSession(TwitterSession.from(sessionPayload.clientId, sessionPayload));
            } catch (error) {
                if (error instanceof FetchError) return;
                if (error instanceof ForbiddenError) {
                    enqueueForbiddenMessage();
                    return;
                }
                if (error instanceof FireflyAlreadyBoundError) {
                    enqueueWarningMessage(
                        t`The account you are trying to log in with is already linked to a different Firefly account.`,
                    );
                    return;
                }

                enqueueMessageFromError(error, t`Oops... Something went wrong. Please try again`);

                if (error instanceof AuthenticationError) await signOut({ redirect: false });
                state.clear();
                twitterSessionHolder.removeSession();
            } finally {
                state.__setStatus__(AsyncStatus.Idle);
            }
        },
    },
);

export const useTwitterProfileStore = createSelectors(state, customSelectors);
