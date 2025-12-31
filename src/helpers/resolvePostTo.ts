import { createLookupTableResolver , UnreachableError } from '@dimensiondev/utils';

import { type SocialSource, Source } from '@/constants/enum.js';
import { postToBsky } from '@/providers/bsky/postToBsky.js';
import { postToFarcaster } from '@/providers/farcaster/postToFarcaster.js';
import { postToLens } from '@/providers/lens/postToLens.js';
import { postToTwitter } from '@/providers/twitter/postToTwitter.js';

export const resolvePostTo = createLookupTableResolver<SocialSource, typeof postToLens>(
    {
        [Source.Lens]: postToLens,
        [Source.Farcaster]: postToFarcaster,
        [Source.Twitter]: postToTwitter,
        [Source.Bsky]: postToBsky,
    },
    (source: SocialSource) => {
        throw new UnreachableError('source', source);
    },
);
