import { bom, parseJson } from '@dimensiondev/utils';
import type { StorageValue } from 'zustand/middleware';

import type { ProfileSource, SocialSource } from '@/constants/enum.js';
import { type SessionState, setSessionStateToStorage } from '@/helpers/createSessionStorage.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveProfileStorageKey } from '@/helpers/resolveProfileStorageKey.js';
import type { Session } from '@/providers/types/Session.js';
import { ProfileStoreSchema } from '@/schemas/profile.js';

function updateProfileStorage(source: ProfileSource, session: Session) {
    const storageKey = resolveProfileStorageKey(source);
    const stateStr = bom.localStorage?.getItem(storageKey);
    if (!stateStr) return;

    const jsonData = parseJson<StorageValue<SessionState>>(stateStr);
    const parsed = ProfileStoreSchema.safeParse(jsonData);
    if (!parsed.success || !jsonData) {
        console.error('Failed to parse profile state from storage', parsed.error);
        return;
    }

    const currentProfile = jsonData.state.currentProfile;
    if (!currentProfile) return;

    setSessionStateToStorage(storageKey, {
        ...jsonData,
        state: {
            ...jsonData.state,
            accounts: jsonData.state.accounts.map((x) => {
                if (isSameProfile(x.profile, currentProfile)) {
                    return {
                        ...x,
                        session,
                    };
                }

                return x;
            }),
            currentProfileSession: session,
        },
    });
}

export function updateCurrentSessionToStorage(source: SocialSource, session: Session) {
    try {
        updateProfileStorage(source, session);
    } catch (error) {
        console.error('Failed to update current session to storage', error);
    }
}
