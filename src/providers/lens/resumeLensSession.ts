import { refresh } from '@lens-protocol/client/actions';

import { FetchError } from '@/constants/error.js';
import { ensureLensResult, ensureLensResultSync } from '@/helpers/ensureLensResult.js';
import { getLensCredentialsFromStorage, updateCredentialsStorage } from '@/helpers/getLensCredentialsFromStorage.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { parseLensAccessToken } from '@/helpers/parseLensAccessToken.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
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
                return await runResumeTask(currentProfileId, retryCount + 1, onResumeFailure);
            }

            const refreshedCredentials = refreshedCredentialsResult.value;
            if (refreshedCredentials.__typename === 'ForbiddenError') {
                console.warn('[resume lens] clean the lens store because refresh token is invalid');
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
