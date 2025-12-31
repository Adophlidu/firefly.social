'use client';

import { bom , ForbiddenError } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { getSession, signOut } from 'next-auth/react';

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
import { resolveSourceFromSessionType } from '@/helpers/resolveSource.js';
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
                if (!session?.user || !session.token || session.type === SessionType.Twitter) return;

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

                const foundNewSessionFromServer = !!(
                    thirdPartySession &&
                    !state.accounts.some((x) => isSameSession(thirdPartySession, x.session as ThirdPartySession))
                );
                if (!foundNewSessionFromServer) return;

                state.__setStatus__(AsyncStatus.Pending);

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
                        fireflySession: foundNewSessionFromServer
                            ? await bindOrRestoreFireflySession(thirdPartySession)
                            : undefined,
                    },
                    {
                        skipBelongsToCheck: !foundNewSessionFromServer,
                        skipResumeFireflyAccounts: !foundNewSessionFromServer,
                        skipResumeFireflySession: !foundNewSessionFromServer,
                        skipSyncAccounts: !foundNewSessionFromServer,
                    },
                );
                if (!result) return;

                enqueueSuccessMessage(t`Your ${session.type} account is now connected`);
            } catch (error) {
                if (error instanceof ForbiddenError) {
                    enqueueForbiddenMessage();
                    return;
                }
                if (error instanceof FireflyAlreadyBoundError && session?.type === SessionType.Apple) {
                    enqueueWarningMessage(t`This Apple account is already linked to another Firefly account.`);
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
