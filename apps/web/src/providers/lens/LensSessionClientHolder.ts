import { AuthenticationError } from '@dimensiondev/utils';
import { type SessionClient } from '@lens-protocol/client';

class LensSessionClientHolder {
    private lensSessionClient: SessionClient | null = null;

    get sessionClient(): SessionClient {
        if (!this.lensSessionClient) {
            throw new AuthenticationError('No session client found in Lens session holder');
        }
        return this.lensSessionClient;
    }

    setSessionClient(client: SessionClient) {
        this.lensSessionClient = client;
    }

    resetSessionClient() {
        this.lensSessionClient = null;
    }
}

export const lensSessionClientHolder = new LensSessionClientHolder();
