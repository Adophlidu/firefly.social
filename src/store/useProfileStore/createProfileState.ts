'use client';

import type { WritableDraft } from 'immer';
import { create } from 'zustand';
import { persist, type PersistOptions } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { AsyncStatus } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { type CustomSelectors } from '@/helpers/createSelector.js';
import { createSessionStorage, type SessionState } from '@/helpers/createSessionStorage.js';
import { isSameAccount } from '@/helpers/isSameAccount.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import type { Account } from '@/providers/types/Account.js';
import type { Session } from '@/providers/types/Session.js';
import type { Profile, ProfileEditable } from '@/providers/types/SocialMedia.js';

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

export const customSelectors: CustomSelectors<ProfileState> = {
    currentProfile: (state) => (state.status === AsyncStatus.Pending ? null : state.currentProfile),
};

export function createProfileState(
    provider: {
        getUpdatedProfile?: (profile: Profile) => Promise<Profile | null>;
        refreshCurrentAccountSession?: () => Promise<Session | null>;
    },
    options: PersistOptions<ProfileState, SessionState>,
) {
    return create<ProfileState, [['zustand/persist', unknown], ['zustand/immer', unknown]]>(
        persist(
            immer<ProfileState>((set, get) => ({
                status: AsyncStatus.Pending,
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
