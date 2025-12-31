import { createLookupTableResolver , UnreachableError } from '@dimensiondev/utils';

import { type SocialSource, Source } from '@/constants/enum.js';
import {
    FIREFLY_BSKY_PROFILE,
    FIREFLY_FARCASTER_PROFILE,
    FIREFLY_LENS_PROFILE,
    FIREFLY_TWITTER_PROFILE,
} from '@/constants/mentions.js';
import type { Profile } from '@/providers/types/Firefly.js';

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
