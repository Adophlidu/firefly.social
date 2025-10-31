import { bom } from '@firefly/utils';
import { type IStorageProvider, mainnet, PublicClient } from '@lens-protocol/client';

import { LENS_TOKEN_STORAGE_KEY } from '@/constants/index.js';
import { fragments } from '@/providers/lens/fragments/index.js';

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

export function createLensSDK(storage: IStorageProvider) {
    return PublicClient.create({
        environment: mainnet,
        storage,
        fragments,
    });
}
