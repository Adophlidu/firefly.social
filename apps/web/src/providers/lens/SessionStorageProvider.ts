import { SEVEN_DAYS } from '@dimensiondev/constants/static';
import { SessionType, Source } from '@dimensiondev/enums';
import { bom, parseJson } from '@dimensiondev/utils';
import type { EnvironmentConfig, IStorageProvider } from '@lens-protocol/client';
import z from 'zod';

import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { updateCurrentSessionToStorage } from '@/helpers/updateCurrentSessionToStorage.js';
import { resolveLensSessionKey } from '@/providers/lens/resolveLensSessionKey.js';
import { LensSession } from '@/providers/lens/Session.js';

const LensSessionScheme = z.object({
    data: z.object({
        accessToken: z.string(),
        idToken: z.string(),
        refreshToken: z.string(),
    }),
    metadata: z.object({
        createdAt: z.number(),
        updatedAt: z.number(),
        version: z.number(),
    }),
});

export class SessionStorageProvider implements IStorageProvider {
    constructor(private environment: EnvironmentConfig) {}

    get sessionKey() {
        return resolveLensSessionKey(this.environment);
    }

    getItem(key: string) {
        if (key !== this.sessionKey) return bom.localStorage?.getItem(key) ?? null;

        const lensSession = getSessionFromStorage(SessionType.Lens);
        if (!lensSession) return null;

        return JSON.stringify({
            data: {
                accessToken: lensSession.token,
                idToken: lensSession.identityToken || '',
                refreshToken: lensSession.refreshToken,
            },
            metadata: {
                createdAt: lensSession.createdAt || Date.now(),
                updatedAt: Date.now(),
                version: 3,
            },
        });
    }

    setItem(key: string, value: string) {
        if (key !== this.sessionKey) {
            bom.localStorage?.setItem(key, value);
            return;
        }

        const parsed = LensSessionScheme.safeParse(parseJson(value));
        if (!parsed.success) {
            bom.localStorage?.setItem(key, value);
            return;
        }

        const oldLensSession = getSessionFromStorage(SessionType.Lens);
        if (!oldLensSession) return;

        const now = Date.now();
        updateCurrentSessionToStorage(
            Source.Lens,
            new LensSession(
                oldLensSession.profileId,
                parsed.data.data.accessToken,
                now,
                now + SEVEN_DAYS,
                parsed.data.data.refreshToken,
                oldLensSession.address,
                parsed.data.data.idToken,
            ),
        );
    }

    removeItem(key: string) {
        if (key !== this.sessionKey) {
            bom.localStorage?.removeItem(key);
            return;
        }

        return;
    }
}
