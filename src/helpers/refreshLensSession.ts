import type { SessionClient } from '@lens-protocol/client';

import { THIRTY_DAYS } from '@/constants/index.js';
import { ensureLensResultSync } from '@/helpers/ensureLensResult.js';
import { ETH_ZERO_ADDRESS } from '@/helpers/isZeroAddress.js';
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
                  now + THIRTY_DAYS,
                  refreshToken,
                  walletAddress ?? ETH_ZERO_ADDRESS,
              )
            : null;
    if (!session) throw new Error('Failed to refresh session');

    return session;
}
