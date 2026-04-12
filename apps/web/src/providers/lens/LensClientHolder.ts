import type { PublicClient } from '@lens-protocol/client';

import { createLensPublicClient } from '@/providers/lens/createLensPublicClient.js';

class LensClientHolder {
    private lensClient: PublicClient | null = null;

    get client() {
        if (!this.lensClient) {
            this.lensClient = createLensPublicClient();
        }
        return this.lensClient;
    }

    setClient(client: PublicClient) {
        this.lensClient = client;
    }
}

export const lensClientHolder = new LensClientHolder();
