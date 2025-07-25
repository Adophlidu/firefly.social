import { refresh } from '@lens-protocol/client/actions';

import { sentryClient } from '@/configs/sentryClient.js';
import { FetchError } from '@/constants/error.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { ensureLensResult, ensureLensResultSync } from '@/providers/lens/ensureLensResult.js';
import {
    getLensCredentialsFromStorage,
    updateCredentialsStorage,
} from '@/providers/lens/getLensCredentialsFromStorage.js';
import { parseLensAccessToken } from '@/providers/lens/parseLensAccessToken.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { ExceptionId } from '@/providers/types/Telemetry.js';
import { useLensStateStore } from '@/store/useProfileStore.js';

let resumeTask: Promise<string | undefined> | null = null;

async function runResumeTask(
    currentProfileId?: string,
    retryCount = 0,
    onResumeFailure = () => {
        useLensStateStore.getState().clear();
    },
) {
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

        const tokenPayload = parseLensAccessToken(oldCredentials.accessToken);
        const isExpiringSoon = !!tokenPayload?.exp && Date.now() >= tokenPayload.exp * 1000 - 60 * 1000 * 2; // 2 minutes before expiration

        // refresh token if it is expiring soon
        if (isExpiringSoon) {
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
        }

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
