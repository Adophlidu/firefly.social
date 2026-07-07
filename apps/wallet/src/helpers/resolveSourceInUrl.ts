import type { ProfilePageSource, ProfilePageSourceInURL, SocialSource, SocialSourceInURL } from '@dimensiondev/enums';
import { Source, SourceInURL } from '@dimensiondev/enums';
import { createLookupTableResolver, UnreachableError } from '@dimensiondev/utils';

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
        [Source.Tokens]: SourceInURL.Tokens,
        [Source.DAOs]: SourceInURL.DAOs,
        [Source.Polymarket]: SourceInURL.Polymarket,
        [Source.Prediction]: SourceInURL.Prediction,
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
