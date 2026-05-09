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
    const [, _session] = currentProfileSession.split(':');
    return (
        parseJson<{
            token: string;
        }>(atob(_session))?.token ?? null
    );
});
