import type { SessionClient } from '@lens-protocol/client';

import { THIRTY_DAYS } from '@/constants/index.js';
import { ensureLensResultSync } from '@/helpers/ensureLensResult.js';
import { ETH_ZERO_ADDRESS } from '@/helpers/isZeroAddress.js';
import { LensSession } from '@/providers/lens/Session.js';

export function createLensSession(profileId: string, sessionClient: SessionClient) {
    const now = Date.now();

    const credentials = ensureLensResultSync(sessionClient.getCredentials());
    if (!credentials) {
        throw new Error('Failed to get lens credentials');
    }

    const authenticated = ensureLensResultSync(sessionClient.getAuthenticatedUser());

    const address = authenticated.address;
    const { accessToken, refreshToken } = credentials;

    return new LensSession(profileId, accessToken, now, now + THIRTY_DAYS, refreshToken, address ?? ETH_ZERO_ADDRESS);
}
