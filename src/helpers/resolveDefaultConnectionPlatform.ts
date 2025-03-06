import { DefaultConnectionPlatform, type SocialSource, Source } from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';
import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';
import type { WalletConnection } from '@/providers/types/Firefly.js';

export const resolveDefaultConnectionPlatform = createLookupTableResolver<
    WalletConnection['platform'] | SocialSource,
    DefaultConnectionPlatform
>(
    {
        eth: DefaultConnectionPlatform.Wallet,
        solana: DefaultConnectionPlatform.Solana,
        [Source.Twitter]: DefaultConnectionPlatform.Twitter,
        [Source.Bsky]: DefaultConnectionPlatform.Bsky,
        [Source.Farcaster]: DefaultConnectionPlatform.Farcaster,
        [Source.Lens]: DefaultConnectionPlatform.Lens,
    },
    (platform) => {
        throw new UnreachableError('platform', platform);
    },
);
