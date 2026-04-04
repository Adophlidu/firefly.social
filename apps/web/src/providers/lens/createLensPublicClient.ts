import { mainnet, PublicClient } from '@lens-protocol/client';

import { fragments } from '@/providers/lens/fragments/index.js';
import { LocalStorageProvider } from '@/providers/lens/LocalStorageProvider.js';
import { MemoryStorageProvider } from '@/providers/lens/MemoryStorageProvider.js';

export function createLensPublicClient(useLocalStorage = false) {
    const storage = useLocalStorage ? new LocalStorageProvider() : new MemoryStorageProvider();

    return PublicClient.create({
        environment: mainnet,
        storage,
        fragments,
    });
}
