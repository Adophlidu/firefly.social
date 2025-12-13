import { parseJson } from '@dimensiondev/utils';
import { z } from 'zod';
import type { PersistStorage, StorageValue } from 'zustand/middleware';

import { AsyncStatus } from '@/constants/enum.js';
import { logger } from '@/libs/Logger.js';
import { SessionFactory } from '@/providers/base/SessionFactory.js';
import type { Account } from '@/providers/types/Account.js';
import type { Session } from '@/providers/types/Session.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

const STATE_SCHEMA = z.object({
    state: z.object({
        status: z.nativeEnum(AsyncStatus),
        accounts: z.array(
            z.object({
                session: z.string().nullable(),
            }),
        ),
        currentProfileSession: z.string().nullable(),
    }),
    version: z.number(),
});

interface State {
    state: {
        status?: AsyncStatus;
        // for legacy version don't have accounts field
        accounts?: Array<{
            profile: Profile;
            session: string;
        }>;
        currentProfile: Profile | null;
        currentProfileSession: string | null;
    };
    version: number;
}

export interface SessionState {
    status: AsyncStatus;
    accounts: Account[];
    currentProfile: Profile | null;
    currentProfileSession: Session | null;
}

export function setSessionStateToStorage(storageKey: string, newValue: StorageValue<SessionState>) {
    const state = newValue.state as SessionState;
    localStorage.setItem(
        storageKey,
        JSON.stringify({
            ...newValue,
            state: {
                ...state,
                accounts: state.accounts.map((account) => ({
                    ...account,
                    session: account.session.serialize(),
                })),
                currentProfileSession: state.currentProfileSession ? state.currentProfileSession?.serialize() : null,
            },
        }),
    );
}

export function createSessionStorage(): PersistStorage<SessionState> {
    return {
        getItem(name) {
            const raw = localStorage.getItem(name);
            if (!raw) return null;

            const parsedState = parseJson<State>(raw);
            if (!parsedState) return null;

            const output = STATE_SCHEMA.safeParse({
                ...parsedState,
                state: {
                    ...parsedState.state,
                    // for legacy version don't have status field
                    // so we need to provide a default value to bypass the schema validation
                    status: parsedState.state.status ?? AsyncStatus.Idle,
                    // for legacy version don't have accounts field
                    // so we need to provide a default value to bypass the schema validation
                    accounts: parsedState.state.accounts ?? [],
                },
            });
            if (!output.success) {
                logger.error(`[${name}] zod validation failure:`, output.error);
                return null;
            }

            try {
                return {
                    ...parsedState,
                    state: {
                        ...parsedState.state,
                        status: parsedState.state.status ?? AsyncStatus.Idle,
                        accounts:
                            parsedState.state.accounts?.map((account) => ({
                                ...account,
                                session: SessionFactory.createSession(account.session),
                            })) ?? [],
                        currentProfileSession: parsedState.state.currentProfileSession
                            ? SessionFactory.createSession(parsedState.state.currentProfileSession)
                            : null,
                    },
                };
            } catch (error) {
                return null;
            }
        },
        setItem(name, newValue) {
            setSessionStateToStorage(name, newValue);
        },
        removeItem(name) {
            localStorage.removeItem(name);
        },
    };
}
