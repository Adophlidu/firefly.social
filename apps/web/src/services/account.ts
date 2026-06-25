import { NEXT_AUTH_SOURCES, SORTED_SOCIAL_SOURCES, SORTED_THIRD_PARTY_SOURCES } from '@dimensiondev/constants/computed';
import type { ProfileSource, SocialSource } from '@dimensiondev/enums';
import { SessionType, Source } from '@dimensiondev/enums';
import { runInSafe, runInSafeAsync, safeUnreachable } from '@dimensiondev/utils';
import { isSameEthereumAddress } from '@dimensiondev/web3/utils';
import { compact, first } from 'lodash-es';
import { signOut } from 'next-auth/react';

import { queryClient } from '@/configs/queryClient.js';
import { SessionExpiredError } from '@/constants/error.js';
import { EVENT_FIREFLY_SESSION_EXPIRED } from '@/constants/event.js';
import { openAndWaitForCloseConfirmFireflyModal } from '@/controllers/openConfirmFireflyModal.js';
import { closeLoginModal } from '@/controllers/openLoginModal.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { dispatchCustomEvent } from '@/helpers/dispatchCustomEvents.js';
import { getAllProfiles } from '@/helpers/getAllProfiles.js';
import { getProfileState } from '@/helpers/getProfileState.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { isSameAccount } from '@/helpers/isSameAccount.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { isSameSession } from '@/helpers/isSameSession.js';
import { queryMyAllConnections } from '@/helpers/queryMyAllConnections.js';
import { resolveSessionHolder, resolveSessionHolderFromProfileSource } from '@/helpers/resolveSessionHolder.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { logger } from '@/libs/Logger.js';
import { getAllConnections } from '@/providers/firefly/endpoint/getAllConnections.js';
import { reportFarcasterSigner } from '@/providers/firefly/farcaster-account/reportFarcasterSigner.js';
import { createLensAccount } from '@/providers/firefly/lens-account/createLensAccount.js';
import { checkAndSyncMetrics } from '@/providers/firefly/metrics/checkAndSyncMetrics.js';
import { deleteMetrics } from '@/providers/firefly/metrics/deleteMetrics.js';
import { trackReferralConversion } from '@/providers/firefly/referral/trackReferral.js';
import type { FireflySession } from '@/providers/firefly/Session.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import {
    autoLoginLensAccountsInSignup,
    clearAutoLoginLensCache,
} from '@/providers/lens/autoLoginLensAccountsInSignup.js';
import { ensureLensResultSync } from '@/providers/lens/ensureLensResultSync.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import { reLoginLensCurrentAccountWithPrivy } from '@/providers/lens/reLoginLensCurrentAccountWithPrivy.js';
import { setPrivyAsLensManager } from '@/providers/lens/setPrivyAsLensManager.js';
import { updateLensAccounts } from '@/providers/lens/updateLensAccounts.js';
import {
    captureAccountConflictEvent,
    captureAccountCreateSuccessEvent,
    captureAccountLoginEvent,
    captureAccountLogoutAllEvent,
    captureAccountLogoutEvent,
} from '@/providers/telemetry/captureAccountEvent.js';
import { TwitterAuthProvider } from '@/providers/twitter/Auth.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import type { Account } from '@/providers/types/Account.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { ensureSessionIsValid } from '@/services/ensureSessionIsValid.js';
import { downloadAccounts } from '@/services/metrics.js';
import { restoreFireflySession } from '@/services/restoreFireflySession.js';
import { verifyAndGetPassword } from '@/services/verifyAndGetPassword.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import { usePreferencesState } from '@/store/usePreferenceStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';
import { useThirdPartyProfileStore } from '@/store/useProfileStore/useThirdPartyProfileStore.js';

function getContext(source: ProfileSource) {
    return {
        state: getProfileState(source),
        sessionHolder: resolveSessionHolderFromProfileSource(source),
    };
}

function getFireflySession(account: Account) {
    if (account.session.type === SessionType.Firefly) {
        return account.session as FireflySession;
    }
    return account.fireflySession;
}

/**
 * Auto-create a Lens account for a freshly created Firefly account when it was
 * not created from a Lens connection. The backend deploys and binds the Lens
 * account from the Firefly nickname and avatar; the username is the public
 * Firefly id (`ff-<uid>`), which is unique by construction. The backend is
 * idempotent, so re-runs on an already-bound account are no-ops.
 */
async function autoCreateLensAccountForNewFireflyAccount(account: Account) {
    // skip accounts created from a Lens connection — they already have one.
    if (account.profile.profileSource === Source.Lens) return;

    const payload = getFireflySession(account)?.payload;
    if (!payload?.isNew || !payload.uid) return;

    await createLensAccount({
        username: `ff-${payload.uid}`,
        name: payload.displayName ?? undefined,
        avatar: payload.avatar ?? undefined,
    });
}

function hasAnyProfile() {
    return (
        SORTED_SOCIAL_SOURCES.some((x) => !!getProfileState(x).currentProfile) ||
        getSessionFromStorage(SessionType.Apple)
    );
}

interface UpdateStateOptions {
    setAsCurrent?: boolean | ((account: Account) => Promise<void>);
    overwrite?: boolean;
}

async function updateState(accounts: Account[], { setAsCurrent = true, overwrite = false }: UpdateStateOptions = {}) {
    // remove all accounts if overwrite is true
    if (overwrite) {
        await Promise.all(
            SORTED_SOCIAL_SOURCES.map(async (source) => {
                const { state, sessionHolder } = getContext(source);

                // sign out from twitter if the next auth session is found
                if (source === Source.Twitter && state.accounts.some((x) => TwitterSession.isNextAuth(x.session))) {
                    await signOut({
                        redirect: false,
                    });
                }

                state.resetCurrentAccount();
                state.updateAccounts([]);
                sessionHolder.removeSession();
            }),
        );

        const thirdPartyState = useThirdPartyProfileStore.getState();
        const thirdPartyAccounts = thirdPartyState.accounts;

        if (thirdPartyAccounts.length) {
            thirdPartyState.resetCurrentAccount();
            thirdPartyState.updateAccounts([]);
            await signOut({
                redirect: false,
            });
        }
    }

    // add accounts to the store
    accounts.forEach((account) => {
        const { state } = getContext(account.profile.profileSource);
        state.addAccount(account, false);
    });

    // set the first account as the current account if no current account is set
    await Promise.allSettled(
        SORTED_SOCIAL_SOURCES.map(async (x) => {
            const { state, sessionHolder } = getContext(x);

            const account = first(state.accounts);
            if (!account) return;
            if (!sessionHolder?.session) {
                if (typeof setAsCurrent === 'function') {
                    await setAsCurrent(account);
                } else if (setAsCurrent) {
                    sessionHolder?.resumeSession(account.session);
                }
            }
            if (!state.currentProfile) state.updateCurrentAccount(account);
            if (x === Source.Twitter) await TwitterAuthProvider.login();
        }),
    );
}

/**
 * Restore firefly session from social account sessions
 * @param session
 * @param signal
 */
export async function resumeFireflySession(account: Account, signal?: AbortSignal) {
    const fireflySession = getFireflySession(account) ?? (await restoreFireflySession(account.session, signal));
    const fireflyAccount = {
        profile: createDummyProfile(Source.Farcaster, Source.Firefly),
        session: fireflySession,
    } satisfies Account;

    // restore firefly session
    fireflySessionHolder.resumeSession(fireflyAccount.session);

    const allConnection = await getAllConnections();
    const connection = allConnection.account.find((x) => !!x.uid);
    // update firefly state
    const state = getProfileState(Source.Firefly);

    if (connection) {
        const updateAccount = {
            session: fireflySession,
            profile: {
                ...createDummyProfile(Source.Farcaster, Source.Firefly),
                profileId: connection.uid ?? '',
                pfp: connection.avatar ?? '',
                displayName: connection.displayName ?? '',
            },
        } satisfies Account;
        state.updateAccounts([updateAccount]);
        state.updateCurrentAccount(updateAccount);
    } else {
        state.updateAccounts([fireflyAccount]);
        state.updateCurrentAccount(fireflyAccount);
    }

    return allConnection;
}

/**
 * Remove firefly account if no other social account is logged in
 * @returns
 */
async function removeFireflyAccountIfNeeded() {
    if (hasAnyProfile()) return;
    useFireflyProfileStore.getState().clear();
    usePreferencesState.getState().resetPreferences();
    fireflySessionHolder.removeSession();
}

export interface AccountOptions {
    // set the account as the current account, default: true
    setAsCurrent?: boolean | ((account: Account) => Promise<void>);
    // skip the belongs to check, default: false
    skipBelongsToCheck?: boolean;
    // resume accounts from firefly, default: false
    skipResumeFireflyAccounts?: boolean;
    // resume the firefly session, default: false
    skipResumeFireflySession?: boolean;
    // skip reporting farcaster signer, default: true
    skipReportFarcasterSigner?: boolean;
    // skip syncing accounts, default: false
    skipSyncAccounts?: boolean;
    // bind lens manager
    bindLensManager?: boolean;
    // force upload session to metrics for account, default: false
    forceUploadMetrics?: boolean;
    // early return signal
    signal?: AbortSignal;
}

export async function addAccount(account: Account, options?: AccountOptions) {
    const {
        setAsCurrent = true,
        skipBelongsToCheck = false,
        skipResumeFireflyAccounts = false,
        skipResumeFireflySession = false,
        skipReportFarcasterSigner = true,
        skipSyncAccounts = false,
        bindLensManager = true,
        forceUploadMetrics = false,
        signal,
    } = options ?? {};

    const { state, sessionHolder } = getContext(account.profile.profileSource);

    const fireflySession = getFireflySession(account);
    const currentFireflySession = getProfileState(Source.Firefly).currentProfileSession as FireflySession | null;
    const setAsCurrentProfile = typeof setAsCurrent === 'boolean' ? setAsCurrent : true;

    const belongsTo =
        skipBelongsToCheck || !fireflySession || !currentFireflySession || !hasAnyProfile()
            ? true
            : isSameSession(currentFireflySession, fireflySession);

    if (!belongsTo) {
        logger.warn('[account] account does not belong to the current firefly session.', {
            account,
            fireflySession,
            currentFireflySession,
        });
    }

    // resolve conflicted firefly sessions
    if (!skipResumeFireflyAccounts && fireflySession && !belongsTo) {
        closeLoginModal();

        const confirmed = await openAndWaitForCloseConfirmFireflyModal({
            account,
        });

        if (currentFireflySession?.profileId) {
            captureAccountConflictEvent(fireflySession.accountIdForEvent, confirmed);
        }

        if (confirmed) {
            await updateState([account], {
                setAsCurrent,
                overwrite: !belongsTo,
            });
        } else {
            // sign out tw from server if needed
            if (TwitterSession.isNextAuth(account.session)) {
                await signOut({
                    redirect: false,
                });
            }

            // the user rejected to store conflicting accounts
            if (!belongsTo) return false;

            // the user rejected to restore accounts from firefly
            if (account.session.type === SessionType.Firefly) return false;
        }
    }

    // add account to store cause it's from the same firefly session
    if (belongsTo && account.session.type !== SessionType.Firefly) {
        state.addAccount(account, setAsCurrentProfile);
        if (typeof setAsCurrent === 'function') {
            await setAsCurrent(account);
        } else if (setAsCurrent) {
            await sessionHolder.resumeSession(account.session);
        }
    }

    // resume firefly session
    if (!skipResumeFireflySession) {
        logger.warn('[addAccount] resume firefly session');
        await resumeFireflySession(account, signal);
    }

    // report farcaster signer
    runInSafeAsync(async () => {
        if (
            !skipReportFarcasterSigner &&
            fireflySessionHolder.session &&
            account.session.type === SessionType.Farcaster
        ) {
            logger.warn('[addAccount] report farcaster signer');
            reportFarcasterSigner(account.session as FireflySession);
        }
    });

    if (account.profile.profileSource === Source.Lens && bindLensManager && setAsCurrent && belongsTo) {
        await runInSafeAsync(() => setPrivyAsLensManager(account));
    }

    captureAccountLoginEvent(account);
    if (fireflySession?.payload?.isNew) {
        runInSafeAsync(() => trackReferralConversion(fireflySession));
    }
    if (account.fireflySession?.payload?.isNew) captureAccountCreateSuccessEvent(account);

    // auto-create & bind a Lens account for the new Firefly account.
    // we wait for it, but tolerate failures and never retry.
    await runInSafeAsync(() => autoCreateLensAccountForNewFireflyAccount(account));

    if (!skipSyncAccounts && fireflySession) {
        // no need to wait, and we use another status to record
        useGlobalState.getState().setIsSyncingMetrics(true);
        checkAndSyncMetrics(account, { bindLensManager, forceUploadMetrics }).finally(async () => {
            const fireflyAccountId = useFireflyProfileStore.getState().currentProfileSession?.profileId;
            if (!fireflyAccountId) return;

            const newLensAccounts = await runInSafeAsync(() =>
                autoLoginLensAccountsInSignup({
                    fireflyAccountId: fireflyAccountId.toString(),
                    forceUseCache: true,
                }),
            );
            if (newLensAccounts?.length) {
                updateLensAccounts(newLensAccounts);
                queryClient.setQueryData(['auto-login', Source.Lens, fireflyAccountId], newLensAccounts);
            }

            useGlobalState.getState().setIsSyncingMetrics(false);
        });
    }

    // account has been added to the store
    return true;
}

export async function addAccounts(fireflySession: FireflySession, accounts: Account[], options?: AccountOptions) {
    const {
        setAsCurrent = true,
        skipBelongsToCheck = false,
        skipResumeFireflyAccounts = false,
        skipResumeFireflySession = false,
        skipReportFarcasterSigner = true,
        signal,
    } = options ?? {};
    if (!accounts.length) return false;

    if (!skipResumeFireflyAccounts) {
        const currentFireflySession = getProfileState(Source.Firefly).currentProfileSession as FireflySession | null;

        if (!currentFireflySession) {
            await updateState(accounts, {
                setAsCurrent,
            });
        }

        const belongsTo =
            skipBelongsToCheck || !fireflySession || !currentFireflySession || !hasAnyProfile()
                ? true
                : isSameSession(fireflySession, currentFireflySession);
        if (!belongsTo) {
            const confirmed = await openAndWaitForCloseConfirmFireflyModal({
                account: accounts[0]!,
            });
            if (currentFireflySession?.profileId) {
                captureAccountConflictEvent(fireflySession.accountIdForEvent, confirmed);
            }
            if (!confirmed) return false;
            await updateState(accounts, {
                setAsCurrent,
                overwrite: !belongsTo,
            });
        }

        const allProfiles = getAllProfiles();
        const profilesToSync = accounts.filter(
            (account) => !allProfiles.some((profile) => isSameProfile(account.profile, profile)),
        );

        if (profilesToSync.length > 0) {
            await updateState(profilesToSync, {
                setAsCurrent,
                overwrite: false,
            });
        }

        await updateState(accounts, {
            setAsCurrent,
            overwrite: !belongsTo,
        });
    }

    // resume firefly session
    if (!skipResumeFireflySession && accounts[0]) {
        logger.warn('[addAccount] resume firefly session');
        await resumeFireflySession(accounts[0]!, signal);
    }

    // report farcaster signer
    if (!skipReportFarcasterSigner) {
        runInSafeAsync(async () => {
            for (const account of accounts) {
                if (fireflySessionHolder.session && account.session.type === SessionType.Farcaster) {
                    await reportFarcasterSigner(account.session as FireflySession);
                }
            }
        });
    }

    accounts.forEach((account) => {
        captureAccountLoginEvent(account);
    });
    if (fireflySession?.payload?.isNew) {
        runInSafeAsync(() => trackReferralConversion(fireflySession));
        captureAccountCreateSuccessEvent(accounts[0]);
    }

    return true;
}

export async function switchAccount(
    account: Account,
    options?: {
        bindLensManager?: boolean;
        signal?: AbortSignal;
    },
) {
    const { bindLensManager = true } = options ?? {};

    const profileSource = account.profile.profileSource;
    const { state, sessionHolder } = getContext(profileSource);

    let session = account.session;

    // check session
    try {
        session = await ensureSessionIsValid(session);
    } catch (error) {
        if (error instanceof SessionExpiredError) {
            dispatchCustomEvent(EVENT_FIREFLY_SESSION_EXPIRED, { account });
            throw error;
        }
    }

    switch (profileSource) {
        case Source.Lens:
        case Source.Bsky:
            break;
        case Source.Twitter: {
            const nextSession = session as TwitterSession;
            const prevSession = twitterSessionHolder.session;

            try {
                twitterSessionHolder.resumeSession(nextSession);
                const sessionPayload = await TwitterAuthProvider.login();
                if (!sessionPayload) {
                    throw new Error('Failed to login Twitter');
                }
            } catch (error) {
                if (prevSession) {
                    twitterSessionHolder.resumeSession(prevSession);
                    await runInSafeAsync(() => TwitterAuthProvider.login());
                }

                throw error;
            }

            break;
        }
        case Source.Farcaster:
        case Source.Telegram:
        case Source.Google:
        case Source.Apple:
        case Source.Firefly:
        case Source.Email:
            sessionHolder.resumeSession(account.session);
            break;
        default:
            safeUnreachable(profileSource);
    }

    const newAccount = {
        ...account,
        session,
    };
    state.addAccount(newAccount, true);

    // resume session after store updated for lens/bsky
    if ([Source.Lens, Source.Bsky].includes(profileSource)) {
        await sessionHolder.resumeSession(session);
    }

    if (profileSource === Source.Lens && bindLensManager) {
        await runInSafeAsync(() => setPrivyAsLensManager(account));
    }
    // only refresh current profile, because session has been updated
    await runInSafeAsync(() => getProfileState(profileSource)?.refreshCurrentAccount(false));

    // try re-login with privy for lens if possible
    if (profileSource === Source.Lens) {
        runInSafe(() => {
            const privyEvm = first(useFireflyWalletStore.getState().wallets.ethereum)?.address;
            const user = ensureLensResultSync(lensSessionClientHolder.sessionClient.getAuthenticatedUser());
            if (!privyEvm || !user || isSameEthereumAddress(privyEvm, user.signer)) return;

            reLoginLensCurrentAccountWithPrivy(newAccount);
        });
    }
}

async function removeAccount(account: Account, signal?: AbortSignal) {
    const { state, sessionHolder } = getContext(account.profile.profileSource);

    // switch to next available account if the current account is removing.
    if (isSameProfile(state.currentProfile, account.profile)) {
        const nextAccount = state.accounts.find((x) => !isSameAccount(account, x));
        if (nextAccount) {
            await switchAccount(nextAccount, { signal, bindLensManager: false });
            state.removeAccount(account);
        } else {
            state.removeAccount(account);
            sessionHolder.removeSession();
        }
    } else {
        state.removeAccount(account);
    }

    const passcode = await verifyAndGetPassword();
    if (passcode) {
        const remoteAccounts = await downloadAccounts();
        const remoteProfiles = compact(
            remoteAccounts.map(({ metaInfo }) => {
                if (metaInfo.platform === 'bluesky') {
                    return null;
                }
                const source = resolveSocialSource(metaInfo.platform);

                return {
                    ...createDummyProfile(source),
                    profileId: metaInfo.profileId,
                    handle: metaInfo.profileHandle,
                    displayName: metaInfo.name,
                    pfp: metaInfo.avatar,
                } satisfies Profile;
            }),
        );
        if (remoteProfiles.some((x) => isSameProfile(x, account.profile))) {
            await deleteMetrics(passcode, [
                `${resolveSocialSourceInUrl(account.profile.source)}:${account.profile.profileId}`,
            ]);
        }
    }
    await runInSafeAsync(async () => {
        const isNextAuthAccount = NEXT_AUTH_SOURCES.some((source) => account.profile.profileSource === source);
        if (isNextAuthAccount) {
            await signOut({ redirect: false });
            resolveSessionHolderFromProfileSource(account.profile.profileSource)?.removeSession();
        }
    });
    captureAccountLogoutEvent(account);
}

export async function removeAccountsByProfiles(profiles: Profile[], signal?: AbortSignal) {
    for (const profile of profiles) {
        const { state, sessionHolder } = getContext(profile.profileSource);
        const account = state.accounts.find((x) => isSameProfile(x.profile, profile));

        if (!account) continue;

        if (isSameProfile(state.currentProfile, profile)) {
            const nextAccount = state.accounts.find((x) => !isSameAccount(account, x));
            if (nextAccount) {
                await switchAccount(nextAccount, { signal, bindLensManager: false });
                state.removeAccount(account);
            } else {
                state.removeAccount(account);
                sessionHolder.removeSession();
            }
        } else {
            state.removeAccount(account);
        }

        await runInSafeAsync(async () => {
            const isNextAuthAccount = NEXT_AUTH_SOURCES.some((source) => account.profile.profileSource === source);
            if (isNextAuthAccount) {
                await signOut({ redirect: false });
                resolveSessionHolderFromProfileSource(account.profile.profileSource)?.removeSession();
            }
        });

        captureAccountLogoutEvent(account);
    }

    const passcode = await verifyAndGetPassword();
    if (passcode) {
        await deleteMetrics(
            passcode,
            profiles.map((x) => `${resolveSocialSourceInUrl(x.source)}:${x.profileId}`),
        );
    }

    await removeFireflyAccountIfNeeded();
}

export async function removeAccountByProfileId(source: ProfileSource, profileId: string) {
    const { accounts } = getProfileState(source);
    const account = accounts.find((x) => x.profile.profileId === profileId);
    if (!account) {
        logger.warn(`[removeAccountByProfileId] Account not found: ${profileId}`);
        return;
    }

    await removeAccount(account);
    await removeFireflyAccountIfNeeded();
}

export async function removeCurrentAccount(source: SocialSource) {
    const { currentProfile } = getProfileState(source);
    if (!currentProfile) {
        logger.warn(`[removeCurrentAccount] Current account not found: ${source}`);
        return;
    }

    await removeAccountByProfileId(source, currentProfile.profileId);
}

export async function removeAllAccounts() {
    clearAutoLoginLensCache();
    const allAccounts = SORTED_SOCIAL_SOURCES.flatMap((x) => getProfileState(x).accounts);

    await Promise.all(
        SORTED_SOCIAL_SOURCES.map(async (x) => {
            const state = getProfileState(x);
            if (!state.accounts.length) return;

            const hasTwitterSession = state.accounts.some((x) => TwitterSession.isNextAuth(x.session));

            state.clear();
            resolveSessionHolder(x)?.removeSession();

            if (hasTwitterSession) {
                await signOut({
                    redirect: false,
                });
            }
        }),
    );

    await Promise.all(
        SORTED_THIRD_PARTY_SOURCES.map(async (x) => {
            const state = useThirdPartyProfileStore.getState();
            if (!state.accounts.length) return;

            state.clear();
            resolveSessionHolderFromProfileSource(x)?.removeSession();

            await signOut({
                redirect: false,
            });
        }),
    );

    await removeFireflyAccountIfNeeded();

    queryClient.invalidateQueries({ queryKey: queryMyAllConnections.queryKey });

    captureAccountLogoutAllEvent(allAccounts);
}
