import { delay } from '@dimensiondev/utils';
import { InvariantError } from '@lens-protocol/client';
import { refresh } from '@lens-protocol/client/actions';

import { Source } from '@/constants/enum.js';
import { SessionExpiredError } from '@/constants/error.js';
import { FAKE_REFRESH_TOKEN } from '@/constants/lens.js';
import { SEVEN_DAYS } from '@/constants/static.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { autoLoginWithPrivy } from '@/providers/lens/autoLoginWithPrivy.js';
import { createLensPublicClient } from '@/providers/lens/createLensPublicClient.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { LensSession } from '@/providers/lens/Session.js';

const MAX_RETRIES = 5;

export async function refreshLensSession(oldSession: LensSession): Promise<LensSession> {
    if (!oldSession.refreshToken || oldSession.refreshToken === FAKE_REFRESH_TOKEN) {
        throw new SessionExpiredError(Source.Lens, 'No refresh token available in the session');
    }

    try {
        const client = createLensPublicClient();
        for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
            const response = await ensureLensResult(
                refresh(client, {
                    refreshToken: oldSession.refreshToken,
                }),
            );
            if (response.__typename === 'ForbiddenError') {
                throw new SessionExpiredError(Source.Lens, 'ForbiddenError');
            }
            if (response.__typename === 'AuthenticationTokens') {
                const { accessToken, refreshToken, idToken } = response;
                if (!accessToken || !refreshToken) {
                    throw new Error('Missing tokens in refresh response');
                }

                const now = Date.now();
                return new LensSession(
                    oldSession.profileId,
                    accessToken,
                    now,
                    now + SEVEN_DAYS,
                    refreshToken,
                    oldSession.address,
                    idToken,
                );
            }

            // delay with exponential backoff
            if (attempt < MAX_RETRIES - 1) {
                await delay(2 ** attempt * 1000);
            }
        }

        throw new Error('Unknown error during Lens session refresh');
    } catch (error) {
        if (
            error instanceof SessionExpiredError ||
            (error instanceof InvariantError &&
                (error.message.includes('Invalid JWT format') || error.message.includes('ExpiredSignature')))
        ) {
            // try re-login with privy wallet
            const result = await runInSafeAsync(() => autoLoginWithPrivy(oldSession.profileId));
            if (result) return result.account.session;

            const message =
                error instanceof SessionExpiredError
                    ? error.message
                    : error instanceof InvariantError
                      ? error.message
                      : 'Unable to refresh or re-login to Lens session';
            throw new SessionExpiredError(Source.Lens, message);
        }

        throw error;
    }
}
