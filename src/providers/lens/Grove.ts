import { immutable, lensAccountOnly, type Resource, StorageClient } from '@lens-chain/storage-client';
import { evmAddress } from '@lens-protocol/client';
import { getWalletClient } from 'wagmi/actions';

import { config } from '@/configs/wagmiClient.js';
import { LENS_CHAIN_ID } from '@/constants/index.js';

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

    async uploadSingleFile(file: File) {
        const acl = immutable(LENS_CHAIN_ID);
        const result = await GroveStorageProvider.storageClient.uploadFile(file, {
            acl,
        });

        return result;
    }

    async uploadJson(data: unknown) {
        const acl = immutable(LENS_CHAIN_ID);
        const result = await GroveStorageProvider.storageClient.uploadAsJson(data, { acl });

        return result;
    }

    async uploadFiles(files: File[]) {
        const acl = immutable(LENS_CHAIN_ID);
        const result = await GroveStorageProvider.storageClient.uploadFolder(files, {
            acl,
            index: (resources: Resource[]) => {
                return {
                    files: resources.map((resource) => ({
                        uri: resource.uri,
                        gatewayUrl: resource.gatewayUrl,
                        storageKey: resource.storageKey,
                    })),
                };
            },
        });

        return result.files;
    }

    async editSingleFile(
        lensAccountAddress: string, // Lens Account Address
        oldUri: string, // the uri of the file to be edited
        file: File,
    ) {
        const acl = lensAccountOnly(evmAddress(lensAccountAddress), LENS_CHAIN_ID);

        const walletClient = await getWalletClient(config, { chainId: LENS_CHAIN_ID });
        const result = await GroveStorageProvider.storageClient.editFile(oldUri, file, walletClient, { acl });

        return result;
    }
}

export const GroveStorageProvider = new Grove();
