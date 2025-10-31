import { createLookupTableResolver } from '@dimensiondev/utils';

import { ConnectionPlatform, type ProfileSource, Source, SourceInURL } from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';
import type { WalletConnection } from '@/providers/types/Firefly.js';

export const resolveConnectionPlatform = createLookupTableResolver<
    | WalletConnection['platform']
    | ProfileSource
    | Extract<
          SourceInURL,
          | SourceInURL.Farcaster
          | SourceInURL.Lens
          | SourceInURL.Twitter
          | SourceInURL.X
          | SourceInURL.Bsky
          | SourceInURL.Firefly
          | SourceInURL.Wallet
          | SourceInURL.Telegram
          | SourceInURL.Apple
          | SourceInURL.Google
      >,
    ConnectionPlatform
>(
    {
        eth: ConnectionPlatform.Wallet,
        solana: ConnectionPlatform.Solana,
        [Source.Twitter]: ConnectionPlatform.Twitter,
        [Source.Bsky]: ConnectionPlatform.Bsky,
        [Source.Farcaster]: ConnectionPlatform.Farcaster,
        [Source.Lens]: ConnectionPlatform.Lens,
        [Source.Apple]: ConnectionPlatform.Apple,
        [Source.Telegram]: ConnectionPlatform.Telegram,
        [Source.Firefly]: ConnectionPlatform.Firefly,
        [Source.Google]: ConnectionPlatform.Google,
        [Source.Email]: ConnectionPlatform.Email,
        [SourceInURL.Farcaster]: ConnectionPlatform.Farcaster,
        [SourceInURL.Lens]: ConnectionPlatform.Lens,
        [SourceInURL.Twitter]: ConnectionPlatform.Twitter,
        [SourceInURL.X]: ConnectionPlatform.Twitter,
        [SourceInURL.Bsky]: ConnectionPlatform.Bsky,
        [SourceInURL.Firefly]: ConnectionPlatform.Firefly,
        [SourceInURL.Wallet]: ConnectionPlatform.Wallet,
        [SourceInURL.Telegram]: ConnectionPlatform.Telegram,
        [SourceInURL.Apple]: ConnectionPlatform.Apple,
        [SourceInURL.Google]: ConnectionPlatform.Google,
    },
    (platform) => {
        throw new UnreachableError('platform', platform);
    },
);
