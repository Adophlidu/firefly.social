import { bom, parseJson } from '@firefly/utils';
import { z } from 'zod';

import { LENS_TOKEN_STORAGE_KEY } from '@/constants/index.js';
import type { LensCredentials } from '@/providers/types/Lens.js';

const Schema = z.object({
    data: z.object({
        accessToken: z.string().optional(),
        refreshToken: z.string().optional(),
        idToken: z.string().optional(),
    }),
    metadata: z
        .object({
            createdAt: z.number().optional(),
            updatedAt: z.number().optional(),
            version: z.number().optional(),
        })
        .optional(),
});

export function getLensCredentialsFromStorage() {
    if (!bom?.localStorage) return null;

    const tokenData = localStorage.getItem(LENS_TOKEN_STORAGE_KEY);
    if (!tokenData) return null;

    const credentials = parseJson<z.infer<typeof Schema>>(tokenData);
    if (!credentials) return null;

    const parsedCredentials = Schema.safeParse(credentials);
    if (!parsedCredentials.success) return null;

    return credentials;
}

export function updateCredentialsStorage(credentials: LensCredentials) {
    const { metadata } = getLensCredentialsFromStorage() || {};
    const newCredentials = {
        data: {
            accessToken: credentials.accessToken,
            refreshToken: credentials.refreshToken,
            idToken: credentials.idToken,
        },
        metadata: {
            createdAt: metadata?.createdAt || Date.now(),
            updatedAt: Date.now(),
            version: metadata?.version || 3,
        },
    };

    if (bom?.localStorage) {
        localStorage.setItem(LENS_TOKEN_STORAGE_KEY, JSON.stringify(newCredentials));
    }
}
