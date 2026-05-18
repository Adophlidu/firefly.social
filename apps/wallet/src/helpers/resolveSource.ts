import { Source } from '@dimensiondev/enums';
import { createLookupTableResolver, UnreachableError } from '@dimensiondev/utils';

import { FireflyPlatform } from '@/constants/enum.js';

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
    },
    (walletSource) => {
        throw new UnreachableError('FireflyPlatform', walletSource);
    },
);
