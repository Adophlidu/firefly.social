import type { SessionClient } from '@lens-protocol/client';

import { SEVEN_DAYS } from '@/constants/index.js';
import { ETH_ZERO_ADDRESS } from '@/helpers/isZeroAddress.js';
import { ensureLensResultSync } from '@/providers/lens/ensureLensResultSync.js';
import { LensSession } from '@/providers/lens/Session.js';

export async function refreshLensSession(sdk: SessionClient) {
    const credentials = ensureLensResultSync(sdk.getCredentials());
    const user = ensureLensResultSync(sdk.getAuthenticatedUser());
    if (!credentials) throw new Error('No lens credentials found');
    if (!user) throw new Error('No authenticated user found');

    const accessToken = credentials.accessToken;
    const refreshToken = credentials.refreshToken;
    const walletAddress = user.address;
    const profileId = user.address;
    const now = Date.now();

    const session =
        accessToken && refreshToken && walletAddress && profileId
            ? new LensSession(
                  profileId,
                  accessToken,
                  now,
                  now + SEVEN_DAYS,
                  refreshToken,
                  walletAddress ?? ETH_ZERO_ADDRESS,
                  credentials.idToken,
              )
            : null;
    if (!session) throw new Error('Failed to refresh session');

    return session;
}
