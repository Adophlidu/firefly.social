import { Source } from '@dimensiondev/enums';
import { type AccessToken, type IdToken, mainnet, PublicClient, type RefreshToken } from '@lens-protocol/client';

import { SessionExpiredError } from '@/constants/error.js';
import { EVENT_SOCIAL_ACCOUNT_EXPIRED } from '@/constants/event.js';
import { FireflyResponseCode } from '@/constants/responseCode.js';
import { dispatchCustomEvent } from '@/helpers/dispatchCustomEvents.js';
import { getAccountMetricsData } from '@/helpers/getAccountMetricsData.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { updateCurrentSessionToStorage } from '@/helpers/updateCurrentSessionToStorage.js';
import { logger } from '@/libs/Logger.js';
import { checkPasscode } from '@/providers/firefly/metrics/checkPasscode.js';
import { getMetricsStatus } from '@/providers/firefly/metrics/getMetricsStatus.js';
import { fragments } from '@/providers/lens/fragments/index.js';
import { refreshLensSession } from '@/providers/lens/refreshLensSession.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { SessionStorageProvider } from '@/providers/lens/SessionStorageProvider.js';
import { captureAccountLoginEvent } from '@/providers/telemetry/captureAccountEvent.js';
import type { Account } from '@/providers/types/Account.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { uploadMetricsToFirefly } from '@/services/uploadMetrics.js';
import { useTokenPasswordStore } from '@/store/useTokenPasswordStore.js';

async function uploadMetricsAfterForceRefresh(account: Account) {
    try {
        const localPassword = useTokenPasswordStore.getState().password;
        if (!localPassword) return;

        const status = await getMetricsStatus();
        if (!status.hasSetPasscode) return;

        const result = await checkPasscode(localPassword, true);
        if (result?.code !== FireflyResponseCode.SUCCESS) return;

        const metricsData = await getAccountMetricsData(account, localPassword);
        if (!metricsData) return;

        await uploadMetricsToFirefly(localPassword, [metricsData]);
    } catch (error) {
        logger.error('Failed to upload metrics after force refresh.', error);
    }
}

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
            const account = {
                profile: lensProfile,
                origin: 'force_restore',
                session: currentSession,
            } satisfies Account;
            captureAccountLoginEvent(account, { privy_login_type: 'intercept_api' });
            uploadMetricsAfterForceRefresh(account);
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
