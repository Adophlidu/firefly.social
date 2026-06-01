import type { SocialSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { createLookupTableResolver, UnreachableError } from '@dimensiondev/utils';

import { PlatformType } from '@/providers/types/FireflyRedPacket.js';

export const resolveRedPacketPlatformType = createLookupTableResolver<SocialSource, PlatformType>(
    {
        [Source.Lens]: PlatformType.Lens,
        [Source.Farcaster]: PlatformType.Farcaster,
        [Source.Twitter]: PlatformType.Twitter,
        [Source.Bsky]: PlatformType.Bsky,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);
