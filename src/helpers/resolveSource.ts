import { createLookupTableResolver } from '@dimensiondev/utils';

import {
    FireflyPlatform,
    type ProfileSource,
    type SocialSource,
    type SocialSourceInURL,
    Source,
    SourceInURL,
} from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { SessionType } from '@/providers/types/SocialMedia.js';

export const resolveSource = createLookupTableResolver<SourceInURL, Source>(
    {
        [SourceInURL.Farcaster]: Source.Farcaster,
        [SourceInURL.FarcasterV2]: Source.Farcaster,
        [SourceInURL.Lens]: Source.Lens,
        [SourceInURL.Twitter]: Source.Twitter,
        [SourceInURL.Bsky]: Source.Bsky,
        [SourceInURL.Firefly]: Source.Firefly,
        [SourceInURL.Article]: Source.Article,
        [SourceInURL.Wallet]: Source.Wallet,
        [SourceInURL.WalletMix]: Source.WalletMix,
        [SourceInURL.NFTs]: Source.NFTs,
        [SourceInURL.Tokens]: Source.Tokens,
        [SourceInURL.DAOs]: Source.DAOs,
        [SourceInURL.Polymarket]: Source.Polymarket,
        [SourceInURL.Telegram]: Source.Telegram,
        [SourceInURL.Google]: Source.Google,
        [SourceInURL.Apple]: Source.Apple,
        [SourceInURL.Posts]: Source.Posts,
        [SourceInURL.Notifications]: Source.Notifications,
        [SourceInURL.Email]: Source.Email,
        [SourceInURL.Swap]: Source.Swap,
        [SourceInURL.X]: Source.Twitter,
        [SourceInURL.Transactions]: Source.Transactions,
        [SourceInURL.Activities]: Source.Activities,
    },
    (sourceInUrl) => {
        throw new UnreachableError('sourceInUrl', sourceInUrl);
    },
);

export const resolveSourceFromUrl = (source: SourceInURL | string) => {
    try {
        return resolveSource(source as SourceInURL);
    } catch {
        return Source.Farcaster;
    }
};

export const resolveSocialSourceFromUrl = (source: SourceInURL | string) => {
    try {
        return resolveSocialSource(source as SocialSourceInURL);
    } catch {
        return Source.Farcaster;
    }
};

export const resolveSourceFromUrlNoFallback = (source?: SourceInURL | string | null) => {
    try {
        return resolveSource(source as SourceInURL);
    } catch {
        return null;
    }
};

export const resolveSocialSource = createLookupTableResolver<SocialSourceInURL, SocialSource>(
    {
        [SourceInURL.Farcaster]: Source.Farcaster,
        [SourceInURL.Lens]: Source.Lens,
        [SourceInURL.Twitter]: Source.Twitter,
        [SourceInURL.Bsky]: Source.Bsky,
        [SourceInURL.X]: Source.Twitter,
    },
    (sourceInUrl) => {
        throw new UnreachableError('sourceInUrl', sourceInUrl);
    },
);

export const resolveSourceFromSessionType = createLookupTableResolver<SessionType, ProfileSource>(
    {
        [SessionType.Farcaster]: Source.Farcaster,
        [SessionType.Lens]: Source.Lens,
        [SessionType.Twitter]: Source.Twitter,
        [SessionType.Bsky]: Source.Bsky,
        [SessionType.Firefly]: Source.Firefly,
        [SessionType.Apple]: Source.Apple,
        [SessionType.Google]: Source.Google,
        [SessionType.Telegram]: Source.Telegram,
        [SessionType.Email]: Source.Email,
    },
    (sessionType) => {
        throw new UnreachableError('sessionType', sessionType);
    },
);

export const resolveSourceFromFireflyPlatform = createLookupTableResolver<FireflyPlatform, Source>(
    {
        [FireflyPlatform.Farcaster]: Source.Farcaster,
        [FireflyPlatform.Lens]: Source.Lens,
        [FireflyPlatform.Twitter]: Source.Twitter,
        [FireflyPlatform.Bsky]: Source.Bsky,
        [FireflyPlatform.Firefly]: Source.Firefly,
        [FireflyPlatform.Article]: Source.Article,
        [FireflyPlatform.Wallet]: Source.Wallet,
        [FireflyPlatform.NFTs]: Source.NFTs,
        [FireflyPlatform.Token]: Source.Tokens,
        [FireflyPlatform.DAOs]: Source.DAOs,
        [FireflyPlatform.Polymarket]: Source.Polymarket,
        [FireflyPlatform.Bets]: Source.Polymarket,
    },
    (walletSource) => {
        throw new UnreachableError('FireflyPlatform', walletSource);
    },
);

export function resolveSocialSourceFromFireflyPlatform(platform: FireflyPlatform): SocialSource {
    return narrowToSocialSource(resolveSourceFromFireflyPlatform(platform));
}
