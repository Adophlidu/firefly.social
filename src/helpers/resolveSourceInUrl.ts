import { createLookupTableResolver } from '@dimensiondev/utils';

import {
    type ExploreSource,
    type ExploreSourceInURL,
    type NotificationSource,
    type NotificationSourceInURL,
    type ProfilePageSource,
    type ProfilePageSourceInURL,
    type SocialSource,
    type SocialSourceInURL,
    Source,
    SourceInURL,
    TrendingType,
} from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';

export const resolveSourceInUrlForApi = createLookupTableResolver<Source, SourceInURL>(
    {
        [Source.Farcaster]: SourceInURL.Farcaster,
        [Source.Lens]: SourceInURL.Lens,
        [Source.Twitter]: SourceInURL.Twitter,
        [Source.Bsky]: SourceInURL.Bsky,
        [Source.Firefly]: SourceInURL.Firefly,
        [Source.Article]: SourceInURL.Article,
        [Source.Wallet]: SourceInURL.Wallet,
        [Source.WalletMix]: SourceInURL.WalletMix,
        [Source.NFTs]: SourceInURL.NFTs,
        [Source.Tokens]: SourceInURL.Tokens,
        [Source.DAOs]: SourceInURL.DAOs,
        [Source.Bets]: SourceInURL.Bets,
        [Source.Telegram]: SourceInURL.Telegram,
        [Source.Google]: SourceInURL.Google,
        [Source.Apple]: SourceInURL.Apple,
        [Source.Posts]: SourceInURL.Posts,
        [Source.Notifications]: SourceInURL.Notifications,
        [Source.Email]: SourceInURL.Email,
        [Source.Swap]: SourceInURL.Swap,
        [Source.Transactions]: SourceInURL.Transactions,
        [Source.Activities]: SourceInURL.Activities,
        [Source.X3Pro]: SourceInURL.Twitter,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

export function resolveSourceInUrl(source: Source) {
    // twitter -> x
    if (source === Source.Twitter) {
        return SourceInURL.X;
    }

    return resolveSourceInUrlForApi(source);
}

export const resolveSocialSourceInUrl = createLookupTableResolver<SocialSource, SocialSourceInURL>(
    {
        [Source.Farcaster]: SourceInURL.Farcaster,
        [Source.Lens]: SourceInURL.Lens,
        [Source.Bsky]: SourceInURL.Bsky,
        [Source.Twitter]: SourceInURL.Twitter,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

export const resolveExploreSourceInURL = createLookupTableResolver<ExploreSource, ExploreSourceInURL>(
    {
        [Source.Farcaster]: SourceInURL.Farcaster,
        [Source.Lens]: SourceInURL.Lens,
        [Source.Bsky]: SourceInURL.Bsky,
        [Source.Twitter]: SourceInURL.X,
        [TrendingType.Newest]: TrendingType.Newest,
        [TrendingType.Stocks]: TrendingType.Stocks,
        [TrendingType.Trending]: TrendingType.Trending,
        [TrendingType.TopSearches]: TrendingType.TopSearches,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

export const resolveExploreSource = createLookupTableResolver<ExploreSourceInURL, ExploreSource>(
    {
        [SourceInURL.Farcaster]: Source.Farcaster,
        [SourceInURL.Lens]: Source.Lens,
        [SourceInURL.Bsky]: Source.Bsky,
        [SourceInURL.Twitter]: Source.Twitter,
        [SourceInURL.X]: Source.Twitter,
        [TrendingType.Newest]: TrendingType.Newest,
        [TrendingType.Stocks]: TrendingType.Stocks,
        [TrendingType.Trending]: TrendingType.Trending,
        [TrendingType.TopSearches]: TrendingType.TopSearches,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

export const resolveNotificationSource = createLookupTableResolver<NotificationSourceInURL, NotificationSource>(
    {
        [SourceInURL.Notifications]: Source.Notifications,
        [SourceInURL.Farcaster]: Source.Farcaster,
        [SourceInURL.Lens]: Source.Lens,
        [SourceInURL.Bsky]: Source.Bsky,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

export const resolveProfileSourceInURL = createLookupTableResolver<ProfilePageSource, ProfilePageSourceInURL>(
    {
        [Source.Farcaster]: SourceInURL.Farcaster,
        [Source.Lens]: SourceInURL.Lens,
        [Source.Bsky]: SourceInURL.Bsky,
        [Source.Twitter]: SourceInURL.X,
        [Source.Wallet]: SourceInURL.Wallet,
        [Source.WalletMix]: SourceInURL.WalletMix,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);
