import type {
    ExploreSource,
    ExploreSourceInURL,
    NotificationSource,
    NotificationSourceInURL,
    ProfilePageSource,
    ProfilePageSourceInURL,
    SocialSource,
    SocialSourceInURL,
} from '@dimensiondev/enums';
import { Source, SourceInURL, TrendingType } from '@dimensiondev/enums';
import { createLookupTableResolver, UnreachableError } from '@dimensiondev/utils';

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
        [Source.Prediction]: SourceInURL.Prediction,
        [Source.Polymarket]: SourceInURL.Polymarket,
        [Source.Telegram]: SourceInURL.Telegram,
        [Source.Google]: SourceInURL.Google,
        [Source.Apple]: SourceInURL.Apple,
        [Source.Posts]: SourceInURL.Posts,
        [Source.Notifications]: SourceInURL.Notifications,
        [Source.Email]: SourceInURL.Email,
        [Source.Swap]: SourceInURL.Swap,
        [Source.Transactions]: SourceInURL.Transactions,
        [Source.Activities]: SourceInURL.Activities,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

export function resolveSourceInUrl(source: Source) {
    if (source === Source.Twitter) return SourceInURL.X;
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

export const resolveExploreSourceInURL = createLookupTableResolver<string, ExploreSourceInURL>(
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
        [SourceInURL.Lens]: Source.Lens,
        [SourceInURL.Farcaster]: Source.Farcaster,
        [SourceInURL.Bsky]: Source.Bsky,
        [SourceInURL.X]: Source.Twitter,
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
