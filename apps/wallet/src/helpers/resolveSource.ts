import { FireflyPlatform, Source } from '@dimensiondev/enums';
import { createLookupTableResolver, UnreachableError } from '@dimensiondev/utils';

export const resolveSourceFromFireflyPlatform = createLookupTableResolver<FireflyPlatform, Source>(
    {
        [FireflyPlatform.Farcaster]: Source.Farcaster,
        [FireflyPlatform.Lens]: Source.Lens,
        [FireflyPlatform.Twitter]: Source.Twitter,
        [FireflyPlatform.Bsky]: Source.Bsky,
        [FireflyPlatform.Firefly]: Source.Firefly,
        [FireflyPlatform.Article]: Source.Article,
        [FireflyPlatform.Wallet]: Source.Wallet,
        [FireflyPlatform.Token]: Source.Tokens,
        [FireflyPlatform.DAOs]: Source.DAOs,
        [FireflyPlatform.Polymarket]: Source.Prediction,
        [FireflyPlatform.Prediction]: Source.Prediction,
    },
    (walletSource) => {
        throw new UnreachableError('FireflyPlatform', walletSource);
    },
);
