import { InvariantError } from '@lens-protocol/client';
import { refresh } from '@lens-protocol/client/actions';

import { TokenExpiredError } from '@/constants/error.js';
import { LENS_TOKEN_STORAGE_KEY } from '@/constants/index.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { SessionHolder } from '@/providers/base/SessionHolder.js';
import { autoLoginWithPrivy } from '@/providers/lens/autoLoginWithPrivy.js';
import { createLensClient } from '@/providers/lens/createLensClient.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { ensureLensResultSync } from '@/providers/lens/ensureLensResultSync.js';
import { updateCredentialsStorage } from '@/providers/lens/getLensCredentialsFromStorage.js';
import { lensClientHolder } from '@/providers/lens/LensClientHolder.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import { LocalStorageProvider } from '@/providers/lens/LocalStorageProvider.js';
import { refreshLensSession } from '@/providers/lens/refreshLensSession.js';
import { LensSession } from '@/providers/lens/Session.js';
import type { LensCredentials } from '@/providers/types/Lens.js';
import { useLensProfileStore } from '@/store/useProfileStore/useLensProfileStore.js';

class LensSessionHolder extends SessionHolder<LensSession> {
    override assertSession(message?: string): LensSession {
        throw new Error('The Lens session holder does not maintain an internal session, yet the Lens client does.');
    }

    override async refreshSession() {
        try {
            if (!lensClientHolder.client) throw new Error('No lens client SDK found in Lens session holder');

            const currentSession = useLensProfileStore.getState().currentProfileSession;
            const refreshedCredentialsResult = await refresh(lensClientHolder.client, {
                refreshToken: (currentSession as LensSession).refreshToken,
            });

            if (!refreshedCredentialsResult.isOk()) {
                throw refreshedCredentialsResult.error;
            }

            const refreshedCredentials = refreshedCredentialsResult.value;
            if (refreshedCredentials.__typename === 'ForbiddenError') {
                // revoked or expired
                throw new TokenExpiredError('ForbiddenError');
            }

            updateCredentialsStorage(refreshedCredentials);
            const sessionClient = await ensureLensResult(lensClientHolder.client.resumeSession());
            lensSessionClientHolder.setSessionClient(sessionClient);

            // the sdk always maintain a latest session, thought no need to resume session here.
            const session = await refreshLensSession(lensSessionClientHolder.sessionClient);
            return session;
        } catch (error) {
            if (error instanceof InvariantError && error.message?.includes('ExpiredSignature')) {
                throw new TokenExpiredError();
            }
            throw error;
        }
    }

    override async resumeSession(session: LensSession, refreshSession = false): Promise<LensCredentials | undefined> {
        try {
            if (refreshSession && !session.refreshToken) {
                throw new Error('No refresh token found in Lens session holder');
            }
            if (session.refreshToken) {
                const storage = new LocalStorageProvider();

                // renew the sdk instance, since it could possess the old credentials
                lensClientHolder.setClient(createLensClient(storage));

                if (refreshSession) {
                    const refreshedCredentialsResult = await refresh(lensClientHolder.client, {
                        refreshToken: session.refreshToken,
                    });
                    if (!refreshedCredentialsResult.isOk()) {
                        throw refreshedCredentialsResult.error;
                    }

                    const refreshedCredentials = refreshedCredentialsResult.value;
                    if (refreshedCredentials.__typename === 'ForbiddenError') {
                        // revoked or expired
                        throw new TokenExpiredError('ForbiddenError');
                    }
                    updateCredentialsStorage(refreshedCredentials);
                    const sessionClient = await ensureLensResult(lensClientHolder.client.resumeSession());
                    lensSessionClientHolder.setSessionClient(sessionClient);

                    return refreshedCredentials;
                }
            }
            super.resumeSession(session);

            return;
        } catch (error) {
            if (refreshSession) {
                const result = await runInSafeAsync(() => autoLoginWithPrivy(session.profileId));
                if (result) {
                    const credentials = ensureLensResultSync(result.sessionClient.getCredentials());
                    if (credentials) {
                        updateCredentialsStorage(credentials);
                        const sessionClient = await ensureLensResult(lensClientHolder.client.resumeSession());
                        lensSessionClientHolder.setSessionClient(sessionClient);
                        return;
                    }
                }
            }

            if (error instanceof InvariantError && error.message?.includes('ExpiredSignature')) {
                throw new TokenExpiredError();
            }
            throw error;
        }
    }

    override removeSession(): void {
        new LocalStorageProvider().removeItem(LENS_TOKEN_STORAGE_KEY);
        lensSessionClientHolder.resetSessionClient();
        super.removeSession();
    }
}

export const lensSessionHolder = new LensSessionHolder();
