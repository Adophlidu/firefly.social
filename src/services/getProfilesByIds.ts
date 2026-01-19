import { safeUnreachable, UnreachableError } from '@dimensiondev/utils';

import { type SocialSourceInURL, SourceInURL } from '@/constants/enum.js';
import { bskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import { farcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import { getLensProfilesByIds } from '@/providers/lens/getLensProfilesById.js';
import { twitterSocialMediaProxy } from '@/providers/twitter/SocialMedia.js';

export async function getProfilesByIds(source: SocialSourceInURL, ids: string[]) {
    switch (source) {
        case SourceInURL.Farcaster:
            return farcasterSocialMediaProvider.getProfilesByIds(ids);
        case SourceInURL.Lens:
            return getLensProfilesByIds(ids);
        case SourceInURL.X:
        case SourceInURL.Twitter:
            return twitterSocialMediaProxy.getProfilesByIds(ids);
        case SourceInURL.Bsky:
            return bskySocialMediaProvider.getProfilesByIds(ids);
        default:
            safeUnreachable(source);
            throw new UnreachableError('Unknown source', source);
    }
}
