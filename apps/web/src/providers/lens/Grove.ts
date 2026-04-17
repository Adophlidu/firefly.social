import { immutable, StorageClient } from '@lens-chain/storage-client';
import { lens } from 'viem/chains';

class Grove {
    private lensStorageClient: StorageClient | null = null;

    get storageClient() {
        if (!this.lensStorageClient) {
            this.lensStorageClient = StorageClient.create();
        }

        return this.lensStorageClient;
    }

    resolve(storageKeyOrUri: string) {
        return GroveStorageProvider.storageClient.resolve(storageKeyOrUri);
    }

    async uploadJson(data: unknown) {
        const acl = immutable(lens.id);
        const result = await GroveStorageProvider.storageClient.uploadAsJson(data, { acl });
        return result;
    }
}

export const GroveStorageProvider = new Grove();
