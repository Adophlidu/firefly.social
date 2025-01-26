import { safeUnreachable } from '@masknet/kit';

import { type SocialSource, Source } from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';
import { BskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import { FarcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import { TwitterSocialMediaProvider } from '@/providers/twitter/SocialMedia.js';

export function resolveSocialMediaProvider(source: SocialSource) {
    switch (source) {
        case Source.Lens:
            return LensSocialMediaProvider;
        case Source.Farcaster:
            return FarcasterSocialMediaProvider;
        case Source.Twitter:
            return TwitterSocialMediaProvider;
        case Source.Bsky:
            return BskySocialMediaProvider;
        default:
            safeUnreachable(source);
            throw new UnreachableError('social source', source);
    }
}
