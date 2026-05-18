import { SessionType } from '@dimensiondev/enums';
import { isServer } from '@tanstack/react-query';

import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { lensClientHolder } from '@/providers/lens/LensClientHolder.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';

export function getLensClient() {
    if (isServer) return lensClientHolder.client;

    const session = getSessionFromStorage(SessionType.Lens);
    if (!session) return lensClientHolder.client;

    try {
        return lensSessionClientHolder.sessionClient;
    } catch {
        return lensClientHolder.client;
    }
}
