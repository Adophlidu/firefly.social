import { type SocialSource, Source } from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';
import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';
import { Platform } from '@/types/bridge.js';

export const resolveFireflyBridgePlatformFromSocialSource = createLookupTableResolver<SocialSource, Platform>(
    {
        [Source.Twitter]: Platform.Twitter,
        [Source.Farcaster]: Platform.Farcaster,
        [Source.Lens]: Platform.Lens,
        [Source.Bsky]: Platform.Lens,
    },
    (source) => {
        throw new UnreachableError('social source', source);
    },
);
