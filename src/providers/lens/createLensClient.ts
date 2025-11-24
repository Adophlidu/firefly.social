import { type IStorageProvider, mainnet, PublicClient } from '@lens-protocol/client';

import { Source } from '@/constants/enum.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { autoLoginWithPrivy } from '@/providers/lens/autoLoginWithPrivy.js';
import { ensureLensResultSync } from '@/providers/lens/ensureLensResultSync.js';
import { fragments } from '@/providers/lens/fragments/index.js';
import { captureAccountLoginEvent } from '@/providers/telemetry/captureAccountEvent.js';

async function retryOnAutoRefreshError(error: unknown) {
    try {
        const lensProfile = getCurrentProfileFromStorage(Source.Lens);
        if (!lensProfile) return null;

        const { sessionClient, account } = await autoLoginWithPrivy(lensProfile.profileId);
        const credentials = ensureLensResultSync(sessionClient.getCredentials());
        if (credentials) {
            captureAccountLoginEvent(account, { privy_login_type: 'intercept_api' });
        }

        return credentials;
    } catch {
        return null;
    }
}

export function createLensClient(storage: IStorageProvider): PublicClient {
    return PublicClient.create({
        environment: mainnet,
        storage,
        fragments,
        retryOnAutoRefreshError,
    });
}
