import { parseJson } from '@dimensiondev/utils';
import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';

interface FireflySession {
    status: string;
    accounts: unknown[] | null;
    currentProfile: unknown | null;
    currentProfileSession: string;
}

export const fireflySessionStorageAtom = atomWithStorage<{
    state: FireflySession;
    version: number;
} | null>(
    'firefly-state',
    null,
    typeof window !== 'undefined' ? createJSONStorage(() => window.localStorage) : undefined,
    {
        getOnInit: true,
    },
);

export const fireflySessionTokenAtom = atom((get) => {
    const currentProfileSession = get(fireflySessionStorageAtom)?.state.currentProfileSession;
    if (!currentProfileSession) return null;

    const fragments = currentProfileSession.split(':');

    // JWT v3 token: fragment[6] = base64({accessToken, refreshToken, sessionId})
    if (fragments[6]) {
        const jwt = parseJson<{ accessToken: string }>(atob(fragments[6]));
        if (jwt?.accessToken) return jwt.accessToken;
    }

    // Legacy fallback: fragment[1] = base64({type, token, profileId, ...})
    if (fragments[1]) {
        const legacy = parseJson<{ token: string }>(atob(fragments[1]));
        if (legacy?.token) return legacy.token;
    }

    return null;
});
