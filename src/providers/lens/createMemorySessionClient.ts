import { parseJson } from '@dimensiondev/utils';
import { mainnet, PublicClient } from '@lens-protocol/client';

import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { fragments } from '@/providers/lens/fragments/index.js';
import { MemoryStorageProvider } from '@/providers/lens/MemoryStorageProvider.js';
import { resolveLensSessionKey } from '@/providers/lens/resolveLensSessionKey.js';
import type { LensSession } from '@/providers/lens/Session.js';

export async function createMemorySessionClient(session: LensSession) {
    const storageKey = resolveLensSessionKey(mainnet);
    const credentials = {
        accessToken: session.token,
        idToken: session.identityToken,
        refreshToken: session.refreshToken,
    };
    const memoryStorage = new MemoryStorageProvider();

    const publicClient = PublicClient.create({
        environment: mainnet,
        fragments,
        storage: {
            getItem: (key: string) => {
                if (key === storageKey) {
                    return JSON.stringify({
                        data: credentials,
                        metadata: {
                            createdAt: session.createdAt || Date.now(),
                            updatedAt: Date.now(),
                            version: 3,
                        },
                    });
                }

                return memoryStorage.getItem(key);
            },
            setItem: (key: string, value: string) => {
                if (key === storageKey) {
                    const parsed = parseJson<{
                        data: {
                            accessToken: string;
                            idToken: string;
                            refreshToken: string;
                        };
                    }>(value);
                    if (parsed?.data?.accessToken) {
                        credentials.accessToken = parsed.data.accessToken;
                        credentials.idToken = parsed.data.idToken;
                        credentials.refreshToken = parsed.data.refreshToken;
                    }

                    return;
                }

                memoryStorage.setItem(key, value);
            },
            removeItem: (key: string) => {
                if (key === storageKey) return;

                memoryStorage.removeItem(key);
            },
        },
    });
    return ensureLensResult(publicClient.resumeSession());
}
