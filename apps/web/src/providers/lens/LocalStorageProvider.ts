import { bom } from '@dimensiondev/utils';
import type { IStorageProvider } from '@lens-protocol/client';

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
