import { createLookupTableResolver } from '@dimensiondev/utils';

import { type LoginFallbackSource, Source } from '@/constants/enum.js';

export const resolveFallbackImageUrl = createLookupTableResolver<LoginFallbackSource, string>(
    {
        [Source.Farcaster]: '/image/farcaster-fallback.png',
        [Source.Lens]: '/image/lens-fallback.png',
        [Source.Twitter]: '/image/x-fallback.png',
        [Source.Wallet]: '/image/wallet-fallback.png',
        [Source.Bsky]: '/image/bsky-fallback.png',
        [Source.Article]: '/image/firefly-fallback.png',
        [Source.DAOs]: '/image/firefly-fallback.png',
        [Source.Prediction]: '/image/firefly-fallback.png',
        [Source.Tokens]: '/image/firefly-fallback.png',
        [Source.Posts]: '/image/firefly-fallback.png',
        [Source.Notifications]: '/image/firefly-fallback.png',
        [Source.NFTs]: '/image/firefly-fallback.png',
        [Source.Swap]: '/image/firefly-fallback.png',
    },
    '',
);
