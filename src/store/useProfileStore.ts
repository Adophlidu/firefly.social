'use client';

import { t } from '@lingui/core/macro';
import dayjs from 'dayjs';
import type { WritableDraft } from 'immer';
import { jwtDecode } from 'jwt-decode';
import { getSession, signOut } from 'next-auth/react';
import { create } from 'zustand';
import { persist, type PersistOptions } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { sentryClient } from '@/configs/sentryClient.js';
import { AsyncStatus, Source } from '@/constants/enum.js';
import { AuthenticationError, BskySessionExpiredError, FetchError } from '@/constants/error.js';
import { EMPTY_LIST, HIDDEN_SECRET } from '@/constants/index.js';
import { bom } from '@/helpers/bom.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { createSelectors, type CustomSelectors } from '@/helpers/createSelector.js';
import { createSessionStorage } from '@/helpers/createSessionStorage.js';
import { enqueueMessageFromError, enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { isBskyTokenExpired } from '@/helpers/isBskyTokenExpired.js';
import { isSameAccount } from '@/helpers/isSameAccount.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { isSameSession } from '@/helpers/isSameSession.js';
import { resolveSourceFromSessionType } from '@/helpers/resolveSource.js';
import { retryOnBskyWhenNetworkError } from '@/helpers/retryOnBskyWhenNetworkError.js';
import { runInSafe, runInSafeAsync } from '@/helpers/runInSafe.js';
import { getBskySessionStorage, removeBskySessionStorage } from '@/providers/bsky/createBskyAgent.js';
import type { BskySession } from '@/providers/bsky/Session.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { BskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import type { FarcasterSession } from '@/providers/farcaster/Session.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { FarcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import type { FireflySession } from '@/providers/firefly/Session.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { resumeLensSession } from '@/providers/lens/resumeLensSession.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import { ThirdPartySession } from '@/providers/third-party/Session.js';
import { thirdPartySessionHolder } from '@/providers/third-party/SessionHolder.js';
import { TwitterAuthProvider } from '@/providers/twitter/Auth.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import type { Account } from '@/providers/types/Account.js';
import type { Session } from '@/providers/types/Session.js';
import { type Profile, type ProfileEditable, SessionType } from '@/providers/types/SocialMedia.js';
import { ExceptionId } from '@/providers/types/Telemetry.js';
import type { ThirdPartySessionType } from '@/providers/types/ThirdParty.js';
import { addAccount } from '@/services/account.js';
import { addTwitterAccount } from '@/services/addTwitterAccount.js';
import { bindOrRestoreFireflySession } from '@/services/bindOrRestoreFireflySession.js';
import { restoreFireflySessionAll } from '@/services/restoreFireflySession.js';

export interface ProfileState {
    // indicate the store is ready or not in its init phase
    status: AsyncStatus;
    // internally used in this store
    __setStatus__: (status: AsyncStatus) => void;

    accounts: Account[];
    currentProfile: Profile | null;
    currentProfileSession: Session | null;
    addAccount: (account: Account, setAsCurrent: boolean) => void;
    removeAccount: (account: Account) => void;
    updateAccounts: (accounts: Account[]) => void;
    updateCurrentAccount: (account: Account) => void;
    resetCurrentAccount: () => void;
    refreshAccounts: () => void;
    refreshCurrentAccount: () => Promise<void>;
    updateCurrentProfile: (profile: ProfileEditable) => void;
    upgrade: () => void;
    clear: (clearSession?: boolean) => void;
}

export interface ProfileStatePersisted {
    status: AsyncStatus;
    accounts: Account[];
    currentProfile: Profile | null;
    currentProfileSession: Session | null;
}

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

function createState(
    provider: {
        getUpdatedProfile?: (profile: Profile) => Promise<Profile | null>;
        refreshCurrentAccountSession?: () => Promise<Session | null>;
    },
    options: PersistOptions<ProfileState, ProfileStatePersisted>,
) {
    return create<ProfileState, [['zustand/persist', unknown], ['zustand/immer', unknown]]>(
        persist(
            immer<ProfileState>((set, get) => ({
                status: AsyncStatus.Idle,
                accounts: EMPTY_LIST,
                currentProfile: null,
                currentProfileSession: null,
                addAccount: (account, setAsCurrent) =>
                    set((state) => {
                        const account_ = state.accounts.find((x) => isSameAccount(x, account));

                        if (!account_) {
                            // add the new account at the end
                            state.accounts = [...state.accounts, account];
                        } else {
                            // replace the original account with the new one
                            state.accounts = state.accounts.map((x) => (isSameAccount(x, account) ? account : x));
                        }

                        if (setAsCurrent) {
                            state.currentProfile = account.profile;
                            state.currentProfileSession = account.session;
                        }
                    }),
                removeAccount: (account) =>
                    set((state) => {
                        state.accounts = state.accounts.filter((x) => !isSameAccount(x, account));

                        if (isSameProfile(account.profile, state.currentProfile)) {
                            state.currentProfile = null;
                            state.currentProfileSession = null;
                        }
                    }),
                updateAccounts: (accounts) =>
                    set((state) => {
                        state.accounts = accounts;
                    }),
                updateCurrentAccount: (account) =>
                    set((state) => {
                        state.currentProfile = account.profile;
                        state.currentProfileSession = account.session;

                        if (!state.accounts.length) {
                            state.accounts = [account];
                        } else {
                            state.accounts = state.accounts.map((x) => (isSameAccount(x, account) ? account : x));
                        }
                    }),
                updateCurrentProfile: (params) =>
                    set((state) => {
                        if (!state.currentProfile) return;
                        function update(original: WritableDraft<Profile>) {
                            if (params.pfp) original.pfp = params.pfp;
                            if (typeof params.displayName === 'string') original.displayName = params.displayName;
                            if (typeof params.bio === 'string') original.bio = params.bio;
                            if (typeof params.location === 'string') original.location = params.location;
                            if (typeof params.website === 'string') original.website = params.website;
                        }
                        update(state.currentProfile);
                        for (const account of state.accounts) {
                            if (account.profile.profileId !== state.currentProfile.profileId) continue;
                            update(account.profile);
                        }
                    }),
                resetCurrentAccount: () =>
                    set((state) => {
                        if (!state.currentProfile) return;
                        state.currentProfile = null;
                        state.currentProfileSession = null;
                    }),
                refreshAccounts: async () => {
                    const { currentProfile: profile, accounts } = get();
                    const updatedAccounts = await Promise.all(
                        accounts.map(async (account) => {
                            const profile = await provider.getUpdatedProfile?.(account.profile);
                            if (!profile) return account;
                            return {
                                profile,
                                session: account.session,
                            };
                        }),
                    );
                    if (!updatedAccounts.length) return;

                    // might be logged out
                    if (!get().currentProfileSession) return;

                    set((state) => {
                        const account = accounts.find((x) => isSameProfile(x.profile, profile));
                        if (account) state.updateCurrentAccount?.(account);
                        state.updateAccounts(updatedAccounts);
                    });
                },
                refreshCurrentAccount: async () => {
                    const { currentProfile: profile } = get();
                    if (!profile) return;

                    const session = await provider.refreshCurrentAccountSession?.();

                    const updatedProfile = await provider.getUpdatedProfile?.(profile);
                    if (!updatedProfile) return;

                    set((state) => {
                        state.currentProfile = updatedProfile;
                        if (session) state.currentProfileSession = session;
                        state.accounts = state.accounts.map((x) => {
                            if (isSameProfile(x.profile, profile)) {
                                return {
                                    profile: updatedProfile,
                                    session: session ?? x.session,
                                };
                            }
                            return x;
                        });
                    });
                },
                // internal use only
                __setStatus__: (status) =>
                    set((state) => {
                        state.status = status;
                    }),
                upgrade: () =>
                    set((state) => {
                        if (state.currentProfile && state.currentProfileSession && !state.accounts.length) {
                            state.updateCurrentAccount({
                                profile: state.currentProfile,
                                session: state.currentProfileSession,
                            });
                        }
                    }),
                clear: (clearSession = true) =>
                    set((state) => {
                        state.status = AsyncStatus.Idle;
                        state.accounts = EMPTY_LIST;
                        state.currentProfile = null;
                        if (clearSession) {
                            state.currentProfileSession = null;
                        }
                    }),
            })),
            {
                storage: createSessionStorage(),
                partialize: (state) => ({
                    status: state?.status ?? AsyncStatus.Idle,
                    accounts: state.accounts,
                    currentProfile: state.currentProfile,
                    currentProfileSession: state.currentProfileSession,
                }),
                ...options,
            },
        ),
    );
}

const useFarcasterStateBase = createState(
    {
        getUpdatedProfile: (profile: Profile) => FarcasterSocialMediaProvider.getProfileById(profile.profileId),
    },
    {
        name: 'farcaster-state',
        onRehydrateStorage: () => async (state) => {
            if (!bom.window || !state) return;

            state.upgrade();

            if (state.currentProfileSession) {
                const farcasterSession = state.currentProfileSession as FarcasterSession;
                farcasterSessionHolder.resumeSession(farcasterSession);
            }
        },
    },
);

const useLensStateBase = createState(
    {
        getUpdatedProfile: (profile: Profile) => LensSocialMediaProvider.getProfileByHandle(profile.handle),
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

const useTwitterStateBase = createState(
    {},
    {
        name: 'twitter-state',
        onRehydrateStorage: () => async (state) => {
            if (!bom.window || !state || bom.location?.pathname.includes('/telegram/login')) return;

            state.upgrade();

            try {
                const session = state.currentProfileSession as TwitterSession | null;
                // clean the local store if the consumer secret is not hidden
                if (session?.payload.consumerSecret && session.payload.consumerSecret !== HIDDEN_SECRET) {
                    state.clear();
                    return;
                }

                const nextSession = (await runInSafeAsync(() => getSession())) as TwitterNextSession | null;
                const idFromSession = nextSession?.type === SessionType.Twitter ? nextSession?.user?.id : undefined;
                const createdAt = dayjs((nextSession?.token.createdAt || 0) * 1000);
                const isNewLogin =
                    !!idFromSession &&
                    !state.accounts.some((x) => x.session.profileId === idFromSession) &&
                    dayjs().diff(createdAt, 'minute') < 5;

                // resume the session if it exists
                if (session && !isNewLogin) twitterSessionHolder.resumeSession(session);

                // no remote session found
                const sessionPayload = await TwitterAuthProvider.login(isNewLogin);
                if (!sessionPayload) {
                    state.clear();
                    twitterSessionHolder.removeSession();
                    return;
                }

                // show indicator if the session is from the server
                state.__setStatus__(AsyncStatus.Pending);
                await addTwitterAccount(sessionPayload, !session || isNewLogin);
                twitterSessionHolder.resumeSession(TwitterSession.from(sessionPayload.clientId, sessionPayload));
            } catch (error) {
                if (error instanceof FetchError) return;
                if (error instanceof AuthenticationError) await signOut({ redirect: false });
                state.clear();
                twitterSessionHolder.removeSession();
            } finally {
                state.__setStatus__(AsyncStatus.Idle);
            }
        },
    },
);

const useBskyStateBase = createState(
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

const useThirdPartyStateBase = createState(
    {},
    {
        name: 'third-party-state',
        onRehydrateStorage: () => async (state) => {
            if (!bom.window || !state || bom.location?.pathname.includes('/telegram/login')) return;

            state.upgrade();

            try {
                const session = (await getSession()) as unknown as ThirdPartySessionType;
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
                        skipSyncAccounts: true,
                    },
                );
                if (!result) return;

                enqueueSuccessMessage(t`Your ${session.type} account is now connected`);
            } catch (error) {
                if (error instanceof Error && error.message.includes('This apple already bound to the other account')) {
                    enqueueWarningMessage(t`This Apple account is already linked to another Firefly account.`);
                    return;
                }

                enqueueMessageFromError(error, t`Oops... Something went wrong. Please try again`);
                state.clear();
                thirdPartySessionHolder.removeSession();
                await signOut({ redirect: false });
            } finally {
                state.__setStatus__(AsyncStatus.Idle);
            }
        },
    },
);

const useFireflyStateBase = createState(
    {},
    {
        name: 'firefly-state',
        onRehydrateStorage: () => async (state) => {
            if (!bom.window || !state) return;

            try {
                const session = state.currentProfileSession || (await restoreFireflySessionAll());

                if (session) {
                    fireflySessionHolder.resumeSession(session as FireflySession);

                    state.updateCurrentAccount({
                        profile: createDummyProfile(Source.Farcaster),
                        session,
                    });
                } else {
                    state.clear();
                }
            } catch (error) {
                if (error instanceof FetchError) return;
                state.clear();
            }
        },
    },
);

const customSelectors: CustomSelectors<ProfileState> = {
    currentProfile: (state) => (state.status === AsyncStatus.Pending ? null : state.currentProfile),
};

export const useLensStateStore = createSelectors(useLensStateBase, customSelectors);
export const useFarcasterStateStore = createSelectors(useFarcasterStateBase, customSelectors);
export const useTwitterStateStore = createSelectors(useTwitterStateBase, customSelectors);
export const useBskyStateStore = createSelectors(useBskyStateBase, customSelectors);
export const useThirdPartyStateStore = createSelectors(useThirdPartyStateBase, customSelectors);
export const useFireflyStateStore = createSelectors(useFireflyStateBase, customSelectors);
