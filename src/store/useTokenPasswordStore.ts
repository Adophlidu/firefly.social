import { parseJson } from '@firefly/utils';
import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createSelectors } from '@/helpers/createSelector.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { SessionFactory } from '@/providers/base/SessionFactory.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { decryptPassword, encryptPassword } from '@/services/crypto.js';

interface TokenPasswordState {
    password: string | null;
    setPassword: (password: string) => void;
}

interface State {
    state: {
        password: string | null;
    };
    version: number;
}

interface FireflyState {
    state: {
        currentProfileSession: string | null;
    };
}

const useTokenPasswordStoreBase = create<
    TokenPasswordState,
    [['zustand/persist', unknown], ['zustand/immer', unknown]]
>(
    persist(
        immer((set) => ({
            password: null,
            setPassword: (password: string) =>
                set((state) => {
                    state.password = password;
                }),
        })),
        {
            name: 'token-password-state',
            storage: {
                getItem: (name) => {
                    const raw = localStorage.getItem(name);
                    if (!raw) return null;

                    const parsedState = parseJson<State>(raw);
                    if (!parsedState) return null;

                    const fireflyState = parseJson<FireflyState>(localStorage.getItem('firefly-state'));
                    const accountId = fireflyState?.state?.currentProfileSession
                        ? SessionFactory.createSession(fireflyState.state.currentProfileSession)?.profileId
                        : null;
                    if (!accountId) return parsedState;

                    return {
                        ...parsedState,
                        state: {
                            ...parsedState.state,
                            password: parsedState.state.password
                                ? decryptPassword(parsedState.state.password, String(accountId))
                                : null,
                        },
                    };
                },
                setItem: (name, value) => {
                    const accountId = getSessionFromStorage(SessionType.Firefly)?.profileId;
                    if (!accountId) return;

                    const state = value.state;
                    localStorage.setItem(
                        name,
                        JSON.stringify({
                            ...value,
                            state: {
                                ...state,
                                password: state.password ? encryptPassword(state.password, String(accountId)) : null,
                            },
                        }),
                    );
                },
                removeItem: (name) => {
                    localStorage.removeItem(name);
                },
            } as PersistStorage<TokenPasswordState>,
        },
    ),
);

export const useTokenPasswordStore = createSelectors(useTokenPasswordStoreBase);
