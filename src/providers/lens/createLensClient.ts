import { type AccessToken, type IdToken, mainnet, PublicClient, type RefreshToken } from '@lens-protocol/client';

import { Source } from '@/constants/enum.js';
import { SessionExpiredError } from '@/constants/error.js';
import { EVENT_SOCIAL_ACCOUNT_EXPIRED } from '@/constants/event.js';
import { dispatchCustomEvent } from '@/helpers/dispatchCustomEvents.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { updateCurrentSessionToStorage } from '@/helpers/updateCurrentSessionToStorage.js';
import { fragments } from '@/providers/lens/fragments/index.js';
import { LocalStorageProvider } from '@/providers/lens/LocalStorageProvider.js';
import { MemoryStorageProvider } from '@/providers/lens/MemoryStorageProvider.js';
import { refreshLensSession } from '@/providers/lens/refreshLensSession.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { SessionStorageProvider } from '@/providers/lens/SessionStorageProvider.js';
import { captureAccountLoginEvent } from '@/providers/telemetry/captureAccountEvent.js';
import { SessionType } from '@/providers/types/SocialMedia.js';

async function retryOnAutoRefreshError(error: unknown) {
    try {
        const lensSession = getSessionFromStorage(SessionType.Lens);
        if (!lensSession) return null;

        const newSession = await refreshLensSession(lensSession);
        updateCurrentSessionToStorage(Source.Lens, newSession);
        await lensSessionHolder.resumeSession(newSession);

        const currentSession = getSessionFromStorage(SessionType.Lens);
        const lensProfile = getCurrentProfileFromStorage(Source.Lens);
        if (currentSession && lensProfile) {
            captureAccountLoginEvent(
                {
                    profile: lensProfile,
                    origin: 'force_restore',
                    session: currentSession,
                },
                { privy_login_type: 'intercept_api' },
            );
        }

        return {
            accessToken: newSession.token as AccessToken,
            idToken: newSession.identityToken as IdToken,
            refreshToken: newSession.refreshToken as RefreshToken,
        };
    } catch (error) {
        if (error instanceof SessionExpiredError) {
            dispatchCustomEvent(EVENT_SOCIAL_ACCOUNT_EXPIRED, {
                source: Source.Lens,
            });
        }

        return null;
    }
}

export function createLensSessionClient() {
    return PublicClient.create({
        environment: mainnet,
        storage: new SessionStorageProvider(mainnet),
        fragments,
        retryOnAutoRefreshError,
    });
}

export function createLensPublicClient(useLocalStorage = false) {
    const storage = useLocalStorage ? new LocalStorageProvider() : new MemoryStorageProvider();

    return PublicClient.create({
        environment: mainnet,
        storage,
        fragments,
    });
}
