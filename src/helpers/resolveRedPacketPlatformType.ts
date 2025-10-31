import { createLookupTableResolver } from '@dimensiondev/utils';

import { type SocialSource, Source } from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';
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
