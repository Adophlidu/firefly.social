import { safeUnreachable } from '@masknet/kit';
import { isServer } from '@tanstack/react-query';

import { type SocialSource, Source } from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';
import { BskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import { FarcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import { NitterSocialMediaProvider } from '@/providers/twitter/NitterSocialMedia.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import { TwitterSocialMediaProvider } from '@/providers/twitter/SocialMedia.js';

interface Options {
    /**
     * Specific preferred Twitter provider to use. 'twitter' for Twitter, 'nitter' for Nitter.
     */
    [Source.Twitter]?: 'nitter' | 'twitter';
}

export function resolveSocialMediaProvider(source: SocialSource, options?: Options) {
    switch (source) {
        case Source.Lens:
            return LensSocialMediaProvider;
        case Source.Farcaster:
            return FarcasterSocialMediaProvider;
        case Source.Twitter:
            if (isServer || !twitterSessionHolder.session || options?.[Source.Twitter] === 'nitter')
                return NitterSocialMediaProvider;
            return TwitterSocialMediaProvider;
        case Source.Bsky:
            return BskySocialMediaProvider;
        default:
            safeUnreachable(source);
            throw new UnreachableError('social source', source);
    }
}
