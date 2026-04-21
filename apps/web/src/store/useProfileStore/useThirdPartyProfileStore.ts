'use client';

import { bom, ForbiddenError } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import dayjs from 'dayjs';
import { getSession, signOut } from 'next-auth/react';

import { queryClient } from '@/configs/queryClient.js';
import { AsyncStatus, Source } from '@/constants/enum.js';
import { FireflyAlreadyBoundError } from '@/constants/error.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { createSelectors } from '@/helpers/createSelector.js';
import {
    enqueueForbiddenMessage,
    enqueueMessageFromError,
    enqueueSuccessMessage,
    enqueueWarningMessage,
} from '@/helpers/enqueueMessage.js';
import { isSameSession } from '@/helpers/isSameSession.js';
import { queryMyAllConnections } from '@/helpers/queryMyAllConnections.js';
import { resolveSourceFromSessionType } from '@/helpers/resolveSource.js';
import { logger } from '@/libs/Logger.js';
import { ThirdPartySession } from '@/providers/third-party/Session.js';
import { thirdPartySessionHolder } from '@/providers/third-party/SessionHolder.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import type { ThirdPartySessionType } from '@/providers/types/ThirdParty.js';
import { addAccount } from '@/services/account.js';
import { bindOrRestoreFireflySession } from '@/services/bindOrRestoreFireflySession.js';
import { createProfileState, customSelectors } from '@/store/useProfileStore/createProfileState.js';

const state = createProfileState(
    {},
    {
        name: 'third-party-state',
        onRehydrateStorage: () => async (state) => {
            if (!bom.window || !state || bom.location?.pathname.includes('/telegram/login')) return;

            state.upgrade();

            let session: ThirdPartySessionType | null = null;
            try {
                session = (await getSession()) as unknown as ThirdPartySessionType;
                if (
                    !session?.user ||
                    !session.token ||
                    (session.type !== SessionType.Google && session.type !== SessionType.Apple)
                ) {
                    return;
                }

                const thirdPartySession = session.user?.id
                    ? new ThirdPartySession(
                          session.type,
                          session.user.id,
                          session.token.id_token,
                          session.token.createdAt,
                          session.token.expiresAt,
                          {
                              nonce: session.token.nonce,
                          },
                      )
                    : null;
                if (!thirdPartySession) return;

                const createdAt = dayjs((session.token.createdAt || 0) * 1000);
                const isRecentLogin = dayjs().diff(createdAt, 'minute') < 5;

                const isNewSession = !state.accounts.some((x) =>
                    isSameSession(thirdPartySession, x.session as ThirdPartySession),
                );

                const foundNewSessionFromServer = isNewSession && isRecentLogin;
                if (!foundNewSessionFromServer) return;

                state.__setStatus__(AsyncStatus.Pending);

                logger.info('[useThirdPartyProfileStore] state.accounts:', state.accounts.length);
                logger.info('[useThirdPartyProfileStore] getSession result:', session?.type, session?.user?.id);
                const result = await addAccount(
                    {
                        profile: {
                            ...createDummyProfile(Source.Farcaster),
                            profileId: session.user?.id ?? '',
                            displayName: session.user?.email ?? '',
                            handle: session.user?.email ?? '',
                            fullHandle: session.user?.email ?? '',
                            pfp: session.user?.image ?? '',
                            profileSource: resolveSourceFromSessionType(session.type),
                        },
                        session: thirdPartySession,
                        fireflySession: await bindOrRestoreFireflySession(thirdPartySession),
                    },
                    {
                        skipBelongsToCheck: false,
                        skipResumeFireflyAccounts: false,
                        skipResumeFireflySession: false,
                        skipSyncAccounts: false,
                    },
                );
                if (!result) return;

                queryClient.refetchQueries({ queryKey: queryMyAllConnections.queryKey });
                enqueueSuccessMessage(t`Your ${session.type} account is now connected`);
            } catch (error) {
                if (error instanceof ForbiddenError) {
                    enqueueForbiddenMessage();
                    return;
                }
                if (
                    error instanceof FireflyAlreadyBoundError &&
                    (session?.type === SessionType.Apple || session?.type === SessionType.Google)
                ) {
                    enqueueWarningMessage(t`This ${session.type} account is already linked`);
                    return;
                }

                enqueueMessageFromError(error, t`Oops... Something went wrong. Please try again`);

                await signOut({ redirect: false });
                state.clear();
                thirdPartySessionHolder.removeSession();
            } finally {
                state.__setStatus__(AsyncStatus.Idle);
            }
        },
    },
);

export const useThirdPartyProfileStore = createSelectors(state, customSelectors);
