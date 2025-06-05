import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createSelectors } from '@/helpers/createSelector.js';
import { parseJson } from '@/helpers/parseJson.js';
import { decryptPassword, encryptPassword } from '@/services/tokenPassword.js';

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

                    return {
                        ...parsedState,
                        state: {
                            ...parsedState.state,
                            password: parsedState.state.password ? decryptPassword(parsedState.state.password) : null,
                        },
                    };
                },
                setItem: (name, value) => {
                    const state = value.state;
                    localStorage.setItem(
                        name,
                        JSON.stringify({
                            ...value,
                            state: {
                                ...state,
                                password: state.password ? encryptPassword(state.password) : null,
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
