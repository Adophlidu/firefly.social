import { AuthenticationError, InvariantError, PublicClient, SessionClient } from '@lens-protocol/client';
import { refresh } from '@lens-protocol/client/actions';

import { TokenExpiredError } from '@/constants/error.js';
import { SessionHolder } from '@/providers/base/SessionHolder.js';
import { createLensSDK, LocalStorageProvider, removeLensCredentials } from '@/providers/lens/createLensSDK.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { updateCredentialsStorage } from '@/providers/lens/getLensCredentialsFromStorage.js';
import { refreshLensSession } from '@/providers/lens/refreshLensSession.js';
import { LensSession } from '@/providers/lens/Session.js';
import type { LensCredentials } from '@/providers/types/Lens.js';
import { useLensProfileStore } from '@/store/useProfileStore/useLensProfileStore.js';

class LensSessionHolder extends SessionHolder<LensSession> {
    private lensClientSDK: PublicClient | null = null;
    private lensSessionClient: SessionClient | null = null;

    get sdk() {
        if (!this.lensClientSDK) {
            this.lensClientSDK = createLensSDK(new LocalStorageProvider());
        }
        return this.lensClientSDK;
    }

    get sessionClient(): SessionClient {
        if (!this.lensSessionClient) {
            throw new AuthenticationError('No session client found in Lens session holder');
        }

        return this.lensSessionClient;
    }

    setSessionClient(client: SessionClient) {
        this.lensSessionClient = client;
    }

    resetSessionClient() {
        this.lensSessionClient = null;
    }

    override assertSession(message?: string): LensSession {
        throw new Error('The Lens session holder does not maintain an internal session, yet the Lens client does.');
    }

    override async refreshSession() {
        try {
            if (!this.lensClientSDK) throw new Error('No lens client SDK found in Lens session holder');

            const currentSession = useLensProfileStore.getState().currentProfileSession;
            const refreshedCredentialsResult = await refresh(this.lensClientSDK, {
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
            const sessionClient = await ensureLensResult(this.lensClientSDK.resumeSession());
            this.setSessionClient(sessionClient);

            // the sdk always maintain a latest session, thought no need to resume session here.
            const session = await refreshLensSession(this.sessionClient);
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
                this.lensClientSDK = createLensSDK(storage);
                if (refreshSession) {
                    const refreshedCredentialsResult = await refresh(this.lensClientSDK, {
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
                    const sessionClient = await ensureLensResult(this.lensClientSDK.resumeSession());
                    this.setSessionClient(sessionClient);

                    return refreshedCredentials;
                }
            }
            super.resumeSession(session);

            return;
        } catch (error) {
            if (error instanceof InvariantError && error.message?.includes('ExpiredSignature')) {
                throw new TokenExpiredError();
            }
            throw error;
        }
    }

    override removeSession(): void {
        removeLensCredentials(new LocalStorageProvider());
        this.resetSessionClient();
        super.removeSession();
    }
}

export const lensSessionHolder = new LensSessionHolder();
