import { bom, parseJson } from '@dimensiondev/utils';
import { type z } from 'zod';

import { type ProfileSource, type SocialSource } from '@/constants/enum.js';
import { setSessionStateToStorage } from '@/helpers/createSessionStorage.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveProfileStorageKey } from '@/helpers/resolveProfileStorageKey.js';
import { logger } from '@/libs/Logger.js';
import { SessionFactory } from '@/providers/base/SessionFactory.js';
import { type Session } from '@/providers/types/Session.js';
import { ProfileStoreSchema } from '@/schemas/ProfileStore.js';

function updateProfileStorage(source: ProfileSource, session: Session) {
    const storageKey = resolveProfileStorageKey(source);
    const stateStr = bom.localStorage?.getItem(storageKey);
    if (!stateStr) return;

    const jsonData = parseJson<z.infer<typeof ProfileStoreSchema>>(stateStr);
    const parsed = ProfileStoreSchema.safeParse(jsonData);
    if (!parsed.success || !jsonData) {
        logger.error('Failed to parse profile state from storage', parsed.error);
        return;
    }

    const currentProfile = jsonData.state.currentProfile;
    if (!currentProfile) return;

    setSessionStateToStorage(storageKey, {
        ...jsonData,
        state: {
            ...jsonData.state,
            accounts: jsonData.state.accounts.map((x) => {
                return {
                    ...x,
                    session: isSameProfile(x.profile, currentProfile)
                        ? session
                        : SessionFactory.createSession(x.session),
                };
            }),
            currentProfileSession: session,
        },
    });
}

export function updateCurrentSessionToStorage(source: SocialSource, session: Session) {
    try {
        updateProfileStorage(source, session);
    } catch (error) {
        logger.error('Failed to update current session to storage', error);
    }
}
