import type { SocialSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { createLookupTableResolver, UnreachableError } from '@dimensiondev/utils';

import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

export const resolveRedPacketPlatformType = createLookupTableResolver<SocialSource, FireflyRedPacketAPI.PlatformType>(
    {
        [Source.Lens]: FireflyRedPacketAPI.PlatformType.Lens,
        [Source.Farcaster]: FireflyRedPacketAPI.PlatformType.Farcaster,
        [Source.Twitter]: FireflyRedPacketAPI.PlatformType.Twitter,
        [Source.Bsky]: FireflyRedPacketAPI.PlatformType.Bsky,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);
