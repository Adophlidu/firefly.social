import type { Profile } from '@/providers/types/Firefly.js';
import { createLookupTableResolver } from '@dimensiondev/utils';
import { UnreachableError } from '@/constants/error.js';
import { Source, type SocialSource } from '@/constants/enum.js';
import {
    FIREFLY_FARCASTER_PROFILE,
    FIREFLY_LENS_PROFILE,
    FIREFLY_TWITTER_PROFILE,
    FIREFLY_BSKY_PROFILE,
} from '@/constants/mentions.js';

export const resolveFireflyMention = createLookupTableResolver<SocialSource, Profile>(
    {
        [Source.Farcaster]: FIREFLY_FARCASTER_PROFILE,
        [Source.Lens]: FIREFLY_LENS_PROFILE,
        [Source.Twitter]: FIREFLY_TWITTER_PROFILE,
        [Source.Bsky]: FIREFLY_BSKY_PROFILE,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);
