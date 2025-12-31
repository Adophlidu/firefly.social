import { createLookupTableResolver , UnreachableError } from '@dimensiondev/utils';

import { FireflyPlatform, type SocialSource, Source } from '@/constants/enum.js';

export const resolveFireflyPlatform = createLookupTableResolver<Source, FireflyPlatform | null>(
    {
        [Source.Farcaster]: FireflyPlatform.Farcaster,
        [Source.Lens]: FireflyPlatform.Lens,
        [Source.Twitter]: FireflyPlatform.Twitter,
        // return null to disable mute detection for Bsky
        [Source.Bsky]: null,
        [Source.Firefly]: FireflyPlatform.Firefly,
        [Source.Article]: FireflyPlatform.Article,
        [Source.Wallet]: FireflyPlatform.Wallet,
        [Source.WalletMix]: FireflyPlatform.Wallet,
        [Source.NFTs]: FireflyPlatform.NFTs,
        [Source.Tokens]: FireflyPlatform.Token,
        [Source.DAOs]: FireflyPlatform.DAOs,
        [Source.Bets]: FireflyPlatform.Polymarket,
        [Source.Telegram]: null,
        [Source.Google]: null,
        [Source.Email]: null,
        [Source.Apple]: null,
        [Source.Posts]: null,
        [Source.Notifications]: null,
        [Source.Swap]: null,
        [Source.Transactions]: null,
        [Source.Activities]: null,
        [Source.X3Pro]: null,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

export const resolveFireflyPlatformFromSocialSource = createLookupTableResolver<SocialSource, FireflyPlatform>(
    {
        [Source.Farcaster]: FireflyPlatform.Farcaster,
        [Source.Lens]: FireflyPlatform.Lens,
        [Source.Twitter]: FireflyPlatform.Twitter,
        [Source.Bsky]: FireflyPlatform.Bsky,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);
