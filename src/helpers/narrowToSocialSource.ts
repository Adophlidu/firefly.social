import { createLookupTableResolver, UnreachableError } from '@dimensiondev/utils';

import { type SocialSource, type SocialSourceInURL, Source, SourceInURL } from '@/constants/enum.js';

export const narrowToSocialSource = createLookupTableResolver<Source, SocialSource>(
    {
        [Source.Farcaster]: Source.Farcaster,
        [Source.Lens]: Source.Lens,
        [Source.Twitter]: Source.Twitter,
        [Source.Bsky]: Source.Bsky,
        [Source.Firefly]: Source.Farcaster,
        [Source.Wallet]: Source.Farcaster,
        [Source.WalletMix]: Source.Farcaster,
        // default to Farcaster
        [Source.Article]: Source.Farcaster,
        [Source.NFTs]: Source.Farcaster,
        [Source.Tokens]: Source.Farcaster,
        [Source.DAOs]: Source.Farcaster,
        [Source.Prediction]: Source.Farcaster,
        [Source.Telegram]: Source.Farcaster,
        [Source.Google]: Source.Farcaster,
        [Source.Apple]: Source.Farcaster,
        [Source.Posts]: Source.Farcaster,
        [Source.Notifications]: Source.Farcaster,
        [Source.Email]: Source.Farcaster,
        [Source.Swap]: Source.Farcaster,
        [Source.Transactions]: Source.Farcaster,
        [Source.Activities]: Source.Farcaster,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

export const narrowToSocialSourceInURL = createLookupTableResolver<SourceInURL, SocialSourceInURL>(
    {
        [SourceInURL.Farcaster]: SourceInURL.Farcaster,
        [SourceInURL.Lens]: SourceInURL.Lens,
        [SourceInURL.Twitter]: SourceInURL.Twitter,
        [SourceInURL.Bsky]: SourceInURL.Bsky,
        [SourceInURL.Firefly]: SourceInURL.Farcaster,
        [SourceInURL.Wallet]: SourceInURL.Farcaster,
        [SourceInURL.WalletMix]: SourceInURL.Farcaster,
        [SourceInURL.FarcasterV2]: SourceInURL.Farcaster,
        [SourceInURL.X]: SourceInURL.Twitter,
        // default to Farcaster
        [SourceInURL.Article]: SourceInURL.Farcaster,
        [SourceInURL.NFTs]: SourceInURL.Farcaster,
        [SourceInURL.Tokens]: SourceInURL.Farcaster,
        [SourceInURL.DAOs]: SourceInURL.Farcaster,
        [SourceInURL.Bets]: SourceInURL.Farcaster,
        [SourceInURL.Telegram]: SourceInURL.Farcaster,
        [SourceInURL.Google]: SourceInURL.Farcaster,
        [SourceInURL.Apple]: SourceInURL.Farcaster,
        [SourceInURL.Posts]: SourceInURL.Farcaster,
        [SourceInURL.Notifications]: SourceInURL.Farcaster,
        [SourceInURL.Email]: SourceInURL.Farcaster,
        [SourceInURL.Swap]: SourceInURL.Farcaster,
        [SourceInURL.Transactions]: SourceInURL.Farcaster,
        [SourceInURL.Activities]: SourceInURL.Farcaster,
    },
    (sourceInUrl) => {
        throw new UnreachableError('sourceInUrl', sourceInUrl);
    },
);
