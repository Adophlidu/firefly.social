import { first } from 'lodash-es';
import { signOut } from 'next-auth/react';

import { type ProfileSource, type SocialSource, Source } from '@/constants/enum.js';
import { SORTED_SOCIAL_SOURCES, SORTED_THIRD_PARTY_SOURCES } from '@/constants/index.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { getProfileState } from '@/helpers/getProfileState.js';
import { isSameAccount } from '@/helpers/isSameAccount.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { isSameSession } from '@/helpers/isSameSession.js';
import { resolveSessionHolder, resolveSessionHolderFromProfileSource } from '@/helpers/resolveSessionHolder.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { ConfirmFireflyModalRef, LoginModalRef } from '@/modals/controls.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { FireflySession } from '@/providers/firefly/Session.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import {
    captureAccountConflictEvent,
    captureAccountCreateSuccessEvent,
    captureAccountLoginEvent,
    captureAccountLogoutAllEvent,
    captureAccountLogoutEvent,
} from '@/providers/telemetry/captureAccountEvent.js';
import { captureActivityLoginEvent } from '@/providers/telemetry/captureActivityEvent.js';
import { TwitterAuthProvider } from '@/providers/twitter/Auth.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import type { Account } from '@/providers/types/Account.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { restoreFireflySession } from '@/services/restoreFireflySession.js';
import { usePreferencesState } from '@/store/usePreferenceStore.js';
import { useFireflyStateStore, useThirdPartyStateStore } from '@/store/useProfileStore.js';

function getContext(source: ProfileSource) {
    return {
        state: getProfileState(source),
        sessionHolder: resolveSessionHolderFromProfileSource(source),
    };
}

function getFireflySession(account: Account) {
    if (account.session.type === SessionType.Firefly) {
        if (!account.session) throw new Error('Firefly session is not found');
        return account.session as FireflySession;
    }
    return account.fireflySession;
}

function hasAnySocialProfile() {
    return (
        SORTED_SOCIAL_SOURCES.some((x) => !!getProfileState(x).currentProfile) ||
        useThirdPartyStateStore.getState().currentProfile
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

        const thirdPartyState = useThirdPartyStateStore.getState();
        const thirdPartyAccounts = thirdPartyState.accounts;

        if (thirdPartyAccounts.length) {
            thirdPartyState.resetCurrentAccount();
            thirdPartyState.updateAccounts([]);
            signOut({
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
async function resumeFireflySession(account: Account, signal?: AbortSignal): Promise<void> {
    const fireflySession = getFireflySession(account) ?? (await restoreFireflySession(account.session, signal));
    const fireflyAccount = {
        profile: createDummyProfile(Source.Farcaster, Source.Firefly),
        session: fireflySession,
    } satisfies Account;

    // restore firefly session
    fireflySessionHolder.resumeSession(fireflyAccount.session);

    const allConnection = await FireflyEndpointProvider.getAllConnections();
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
}

/**
 * Remove firefly account if no other social account is logged in
 * @returns
 */
async function removeFireflyAccountIfNeeded() {
    if (hasAnySocialProfile()) return;
    useFireflyStateStore.getState().clear();
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
        signal,
    } = options ?? {};

    const { state, sessionHolder } = getContext(account.profile.profileSource);

    const fireflySession = getFireflySession(account);
    const currentFireflySession = getProfileState(Source.Firefly).currentProfileSession;

    // check if the account belongs to the current firefly session
    const belongsTo =
        skipBelongsToCheck || !fireflySession || !currentFireflySession || !hasAnySocialProfile()
            ? true
            : isSameSession(currentFireflySession, fireflySession);

    if (!belongsTo) {
        console.warn('[account] account does not belong to the current firefly session.', {
            account,
            fireflySession,
            currentFireflySession,
        });
    }

    // resolve conflicted firefly sessions
    if (!skipResumeFireflyAccounts && fireflySession && !belongsTo) {
        LoginModalRef.close();

        const confirmed = await ConfirmFireflyModalRef.openAndWaitForClose({
            account,
        });

        if (currentFireflySession?.profileId) {
            captureAccountConflictEvent(currentFireflySession.profileId as string, fireflySession.profileId, confirmed);
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
        state.addAccount(account, typeof setAsCurrent === 'boolean' ? setAsCurrent : true);
        if (typeof setAsCurrent === 'function') {
            await setAsCurrent(account);
        } else if (setAsCurrent) {
            sessionHolder.resumeSession(account.session);
        }
    }

    // resume firefly session
    if (!skipResumeFireflySession) {
        console.warn('[addAccount] resume firefly session');
        await resumeFireflySession(account, signal);
    }

    await runInSafeAsync(async () => {
        // report farcaster signer
        if (
            !skipReportFarcasterSigner &&
            fireflySessionHolder.session &&
            account.session.type === SessionType.Farcaster
        ) {
            console.warn('[addAccount] report farcaster signer');
            await FireflyEndpointProvider.reportFarcasterSigner(account.session as FireflySession);
        }
    });

    captureAccountLoginEvent(account);
    captureActivityLoginEvent(account);
    if (account.fireflySession?.payload?.isNew) captureAccountCreateSuccessEvent(account);

    // account has been added to the store
    return true;
}

export async function switchAccount(account: Account, signal?: AbortSignal) {
    const { state, sessionHolder } = getContext(account.profile.profileSource);

    sessionHolder.resumeSession(account.session);
    state.addAccount(account, true);
}

async function removeAccount(account: Account, signal?: AbortSignal) {
    const { state, sessionHolder } = getContext(account.profile.profileSource);

    // switch to next available account if the current account is removing.
    if (isSameProfile(state.currentProfile, account.profile)) {
        const nextAccount = state.accounts.find((x) => !isSameAccount(account, x));
        if (nextAccount) {
            await switchAccount(nextAccount, signal);
            state.removeAccount(account);
        } else {
            state.removeAccount(account);
            sessionHolder.removeSession();
        }
    } else {
        state.removeAccount(account);
    }

    runInSafeAsync(async () => {
        if (TwitterSession.isNextAuth(account.session)) {
            await signOut({
                redirect: false,
            });
            twitterSessionHolder.removeSession();
        }
    });
    captureAccountLogoutEvent(account);
}

export async function removeAccountByProfileId(source: ProfileSource, profileId: string) {
    const { accounts } = getProfileState(source);
    const account = accounts.find((x) => x.profile.profileId === profileId);
    if (!account) {
        console.warn(`[removeAccountByProfileId] Account not found: ${profileId}`);
        return;
    }

    await removeAccount(account);
    await removeFireflyAccountIfNeeded();
}

export async function removeCurrentAccount(source: SocialSource) {
    const { currentProfile } = getProfileState(source);
    if (!currentProfile) {
        console.warn(`[removeCurrentAccount] Current account not found: ${source}`);
        return;
    }

    await removeAccountByProfileId(source, currentProfile.profileId);
}

export async function removeAllAccounts() {
    const allAccounts = SORTED_SOCIAL_SOURCES.flatMap((x) => getProfileState(x).accounts);

    SORTED_SOCIAL_SOURCES.forEach(async (x) => {
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
    });

    SORTED_THIRD_PARTY_SOURCES.forEach(async (x) => {
        const state = useThirdPartyStateStore.getState();
        if (!state.accounts.length) return;

        state.clear();
        resolveSessionHolderFromProfileSource(x)?.removeSession();

        await signOut({
            redirect: false,
        });
    });

    await removeFireflyAccountIfNeeded();

    captureAccountLogoutAllEvent(allAccounts);
}
