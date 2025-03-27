import {
    type ExploreSource,
    type ExploreSourceInURL,
    type NotificationSource,
    type NotificationSourceInURL,
    type SocialSource,
    type SocialSourceInURL,
    Source,
    SourceInURL,
    TrendingType,
} from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';
import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';

export const resolveSourceInUrl = createLookupTableResolver<Source, SourceInURL>(
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
        [Source.DAOs]: SourceInURL.DAOs,
        [Source.Polymarket]: SourceInURL.Polymarket,
        [Source.Telegram]: SourceInURL.Telegram,
        [Source.Google]: SourceInURL.Google,
        [Source.Apple]: SourceInURL.Apple,
        [Source.Posts]: SourceInURL.Posts,
        [Source.Notifications]: SourceInURL.Notifications,
        [Source.Email]: SourceInURL.Email,
        [Source.RocketsFun]: SourceInURL.RocketsFun,
        [Source.Swap]: SourceInURL.Swap,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

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
        [TrendingType.TopGainers]: TrendingType.TopGainers,
        [TrendingType.TopLosers]: TrendingType.TopLosers,
        [TrendingType.Trending]: TrendingType.Trending,
        [TrendingType.Meme]: TrendingType.Meme,
        [TrendingType.RocketsFun]: TrendingType.RocketsFun,
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
        [TrendingType.TopGainers]: TrendingType.TopGainers,
        [TrendingType.TopLosers]: TrendingType.TopLosers,
        [TrendingType.Trending]: TrendingType.Trending,
        [TrendingType.Meme]: TrendingType.Meme,
        [TrendingType.RocketsFun]: TrendingType.RocketsFun,
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
