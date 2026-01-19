import { safeUnreachable, UnreachableError } from '@dimensiondev/utils';

import { type SocialSourceInURL, SourceInURL } from '@/constants/enum.js';
import { getBskyProfilesByIds } from '@/providers/bsky/getBskyProfilesByIds.js';
import { getFarcasterProfilesByIds } from '@/providers/farcaster/getFarcasterProfilesByIds.js';
import { getLensProfilesByIds } from '@/providers/lens/getLensProfilesById.js';
import { twitterSocialMediaProxy } from '@/providers/twitter/SocialMedia.js';

export async function getProfilesByIds(source: SocialSourceInURL, ids: string[]) {
    switch (source) {
        case SourceInURL.Farcaster:
            return getFarcasterProfilesByIds(ids);
        case SourceInURL.Lens:
            return getLensProfilesByIds(ids);
        case SourceInURL.X:
        case SourceInURL.Twitter:
            return twitterSocialMediaProxy.getProfilesByIds(ids);
        case SourceInURL.Bsky:
            return getBskyProfilesByIds(ids);
        default:
            safeUnreachable(source);
            throw new UnreachableError('Unknown source', source);
    }
}
