import { safeUnreachable } from '@dimensiondev/utils';
import { isServer } from '@tanstack/react-query';

import { type SocialSource, Source } from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';
import { bskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import { farcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import { lensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import { nitterSocialMediaProxy, twitterSocialMediaProxy } from '@/providers/twitter/SocialMedia.js';

interface Options {
    /**
     * Specific preferred Twitter provider to use. 'twitter' for Twitter, 'nitter' for Nitter.
     */
    [Source.Twitter]?: 'nitter' | 'twitter';
}

export function resolveSocialMediaProvider(source: SocialSource, options?: Options) {
    switch (source) {
        case Source.Lens:
            return lensSocialMediaProvider;
        case Source.Farcaster:
            return farcasterSocialMediaProvider;
        case Source.Twitter:
            const preferred = options?.[Source.Twitter]
                ? options[Source.Twitter]
                : isServer || !twitterSessionHolder.session
                  ? 'nitter'
                  : 'twitter';

            switch (preferred) {
                case 'nitter':
                    return nitterSocialMediaProxy;
                case 'twitter':
                    return twitterSocialMediaProxy;
                default:
                    safeUnreachable(preferred);
                    return twitterSocialMediaProxy;
            }
        case Source.Bsky:
            return bskySocialMediaProvider;
        default:
            safeUnreachable(source);
            throw new UnreachableError('social source', source);
    }
}
