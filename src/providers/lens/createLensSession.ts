import type { SessionClient } from '@lens-protocol/client';

import { SEVEN_DAYS } from '@/constants/index.js';
import { ETH_ZERO_ADDRESS } from '@/helpers/isZeroAddress.js';
import { ensureLensResultSync } from '@/providers/lens/ensureLensResultSync.js';
import { LensSession } from '@/providers/lens/Session.js';

export function createLensSession(profileId: string, sessionClient: SessionClient) {
    const now = Date.now();

    const credentials = ensureLensResultSync(sessionClient.getCredentials());
    if (!credentials) {
        throw new Error('Failed to get lens credentials');
    }

    const authenticated = ensureLensResultSync(sessionClient.getAuthenticatedUser());

    const address = authenticated.address;
    const { accessToken, refreshToken, idToken } = credentials;

    return new LensSession(
        profileId,
        accessToken,
        now,
        now + SEVEN_DAYS,
        refreshToken,
        address ?? ETH_ZERO_ADDRESS,
        idToken,
    );
}
