import { isServer } from '@tanstack/react-query';

import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { SessionType } from '@/providers/types/SocialMedia.js';

export function getLensClient() {
    if (isServer) return lensSessionHolder.sdk;

    const session = getSessionFromStorage(SessionType.Lens);
    if (!session) return lensSessionHolder.sdk;

    try {
        return lensSessionHolder.sessionClient;
    } catch {
        return lensSessionHolder.sdk;
    }
}
