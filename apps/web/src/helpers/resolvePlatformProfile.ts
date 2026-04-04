import { safeUnreachable } from '@dimensiondev/utils';

import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

export function resolvePlatformProfileUrl(platform: FireflyRedPacketAPI.PlatformType, handle: string) {
    switch (platform) {
        case FireflyRedPacketAPI.PlatformType.Farcaster:
            return `/profile/farcaster/${handle}`;
        case FireflyRedPacketAPI.PlatformType.Lens:
            return `/profile/lens/${handle}`;
        case FireflyRedPacketAPI.PlatformType.Twitter:
            return `/profile/x/${handle}`;
        case FireflyRedPacketAPI.PlatformType.Bsky:
            return `/profile/bsky/${handle}`;

        default:
            safeUnreachable(platform);
            return '';
    }
}
