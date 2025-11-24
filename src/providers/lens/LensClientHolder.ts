import { PublicClient } from '@lens-protocol/client';

import { createLensClient } from '@/providers/lens/createLensClient.js';
import { LocalStorageProvider } from '@/providers/lens/LocalStorageProvider.js';

class LensClientHolder {
    private lensClient: PublicClient | null = null;

    get client() {
        if (!this.lensClient) {
            this.lensClient = createLensClient(new LocalStorageProvider());
        }
        return this.lensClient;
    }

    setClient(client: PublicClient) {
        this.lensClient = client;
    }
}

export const lensClientHolder = new LensClientHolder();
