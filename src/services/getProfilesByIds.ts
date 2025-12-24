import { safeUnreachable } from '@dimensiondev/utils';

import { type SocialSourceInURL, SourceInURL } from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';
import { bskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import { farcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import { lensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import { twitterSocialMediaProxy } from '@/providers/twitter/SocialMedia.js';

export async function getProfilesByIds(source: SocialSourceInURL, ids: string[]) {
    switch (source) {
        case SourceInURL.Farcaster:
            return farcasterSocialMediaProvider.getProfilesByIds(ids);
        case SourceInURL.Lens:
            return lensSocialMediaProvider.getProfilesByIds(ids);
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
