import { safeUnreachable } from '@dimensiondev/utils';

import { PlatformType } from '@/providers/types/FireflyRedPacket.js';

export function resolvePlatformProfileUrl(platform: PlatformType, handle: string) {
    switch (platform) {
        case PlatformType.Farcaster:
            return `/profile/farcaster/${handle}`;
        case PlatformType.Lens:
            return `/profile/lens/${handle}`;
        case PlatformType.Twitter:
            return `/profile/x/${handle}`;
        case PlatformType.Bsky:
            return `/profile/bsky/${handle}`;

        default:
            safeUnreachable(platform);
            return '';
    }
}
