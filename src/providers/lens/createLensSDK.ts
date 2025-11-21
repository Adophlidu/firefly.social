import { bom } from '@dimensiondev/utils';
import { type IStorageProvider, mainnet, PublicClient } from '@lens-protocol/client';

import { Source } from '@/constants/enum.js';
import { LENS_TOKEN_STORAGE_KEY } from '@/constants/index.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { autoLoginWithPrivy } from '@/providers/lens/autoLoginWithPrivy.js';
import { ensureLensResultSync } from '@/providers/lens/ensureLensResultSync.js';
import { fragments } from '@/providers/lens/fragments/index.js';
import { captureAccountLoginEvent } from '@/providers/telemetry/captureAccountEvent.js';

export class LocalStorageProvider implements IStorageProvider {
    getItem(key: string) {
        return bom.localStorage?.getItem(key) ?? null;
    }

    setItem(key: string, value: string) {
        bom.localStorage?.setItem(key, value);
    }

    removeItem(key: string) {
        bom.localStorage?.removeItem(key);
    }
}

export class MemoryStorageProvider implements IStorageProvider {
    public storage = new Map<string, string>();

    getItem(key: string) {
        return this.storage.get(key) ?? null;
    }

    setItem(key: string, value: string) {
        this.storage.set(key, value);
    }

    removeItem(key: string) {
        this.storage.delete(key);
    }
}

export function removeLensCredentials(storage: IStorageProvider) {
    storage.removeItem(LENS_TOKEN_STORAGE_KEY);
}

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

export function createLensSDK(storage: IStorageProvider): PublicClient {
    return PublicClient.create({
        environment: mainnet,
        storage,
        fragments,
        retryOnAutoRefreshError,
    });
}
