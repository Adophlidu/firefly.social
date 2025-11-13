import { refresh } from '@lens-protocol/client/actions';
import { jwtDecode } from 'jwt-decode';
import { noop } from 'lodash-es';

import { sentryClient } from '@/configs/sentryClient.js';
import { FetchError } from '@/constants/error.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { autoLoginWithPrivy } from '@/providers/lens/autoLoginWithPrivy.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { ensureLensResultSync } from '@/providers/lens/ensureLensResultSync.js';
import {
    getLensCredentialsFromStorage,
    updateCredentialsStorage,
} from '@/providers/lens/getLensCredentialsFromStorage.js';
import { captureAccountLoginEvent } from '@/providers/telemetry/captureAccountEvent.js';
import { ExceptionId } from '@/providers/types/Telemetry.js';

let resumeTask: Promise<string | undefined> | null = null;

async function runResumeTask(
    currentProfileId?: string,
    retryCount = 0,
    onResumeFailure = noop,
): Promise<string | undefined> {
    try {
        if (retryCount > 5) {
            console.warn('[resume lens] too many retries, clean the lens store');
            sentryClient.captureException(ExceptionId.RESUME_LENS_SESSION, new Error('Too many retries'), {
                profileId: currentProfileId || '',
                reason: 'Too many retries',
            });
            onResumeFailure();
            return;
        }

        const { data: oldCredentials } = getLensCredentialsFromStorage() || {};
        if (!oldCredentials?.accessToken || !oldCredentials?.refreshToken) {
            onResumeFailure();
            return;
        }

        const accessToken = jwtDecode(oldCredentials.accessToken);
        const refreshToken = jwtDecode(oldCredentials.refreshToken);
        const isAccessTokenExpiring = !!accessToken?.exp && Date.now() >= accessToken.exp * 1000 - 60 * 1000 * 2; // 2 minutes before expiration
        const isRefreshTokenExpired = !!refreshToken?.exp && Date.now() >= refreshToken.exp * 1000 - 60 * 1000 * 1; // 1 minutes before expiration

        // refresh token if it is expiring soon
        if (isAccessTokenExpiring && !isRefreshTokenExpired) {
            const { lensSessionHolder } = await import('@/providers/lens/SessionHolder.js');
            const refreshedCredentialsResult = await refresh(lensSessionHolder.sdk, {
                refreshToken: oldCredentials.refreshToken,
            });
            if (!refreshedCredentialsResult.isOk()) {
                sentryClient.captureException(ExceptionId.RESUME_LENS_SESSION, refreshedCredentialsResult.error, {
                    profileId: currentProfileId || '',
                    reason: refreshedCredentialsResult.error.message,
                    position: 'Failed to call refresh',
                });
                return await runResumeTask(currentProfileId, retryCount + 1, onResumeFailure);
            }

            const refreshedCredentials = refreshedCredentialsResult.value;
            if (refreshedCredentials.__typename === 'ForbiddenError') {
                console.warn('[resume lens] clean the lens store because refresh token is invalid');
                sentryClient.captureException(ExceptionId.RESUME_LENS_SESSION, new Error('ForbiddenError'), {
                    profileId: currentProfileId || '',
                    reason: refreshedCredentials.reason,
                    position: 'ForbiddenError',
                });
                onResumeFailure();
                return;
            }
            updateCredentialsStorage(refreshedCredentials);
        } else if (isRefreshTokenExpired && currentProfileId) {
            const { sessionClient, account } = await autoLoginWithPrivy(currentProfileId);
            const credentials = ensureLensResultSync(sessionClient.getCredentials());
            if (!credentials) throw new Error('No credentials returned from session client');

            updateCredentialsStorage(credentials);
            captureAccountLoginEvent(account, { privy_login_type: 'refresh_page' });
        }

        const { lensSessionHolder } = await import('@/providers/lens/SessionHolder.js');
        const sessionClient = await ensureLensResult(lensSessionHolder.sdk.resumeSession());
        if (!sessionClient) {
            console.warn('[resume lens] clean the lens store because failed to call sdk.resumeSession');
            onResumeFailure();
            return;
        }

        const authenticatedUser = ensureLensResultSync(sessionClient.getAuthenticatedUser());
        if (
            !currentProfileId ||
            !authenticatedUser ||
            !isSameEthereumAddress(currentProfileId, authenticatedUser.address)
        ) {
            console.warn(
                '[resume lens] clean the lens store because current profile is not the same as the authenticated user',
            );
            onResumeFailure();
            return;
        }

        lensSessionHolder.setSessionClient(sessionClient);

        const credentials = getLensCredentialsFromStorage();
        if (!credentials?.data?.accessToken) {
            console.warn('[resume lens] clean the lens store because no credentials found');
            onResumeFailure();
            return;
        }

        return credentials.data.accessToken;
    } catch (error) {
        if (error instanceof FetchError) return;

        onResumeFailure();
        return;
    } finally {
        resumeTask = null;
    }
}

export async function resumeLensSession(currentProfileId?: string, onResumeFailure?: () => void) {
    if (!resumeTask) {
        resumeTask = runResumeTask(currentProfileId, 0, onResumeFailure);
    }

    return resumeTask;
}
