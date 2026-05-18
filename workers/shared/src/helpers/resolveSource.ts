import {
    type ProfilePageSource,
    type ProfileSourceInURL,
    type SocialSource,
    type SocialSourceInURL,
    Source,
    SourceInURL,
} from '@dimensiondev/enums';

import { UnreachableError } from '@/shared/src/constants/error.js';
import { createLookupTableResolver } from '@/shared/src/helpers/createLookupTableResolver.js';

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
        [Source.DAOs]: SourceInURL.DAOs,
        [Source.Polymarket]: SourceInURL.Polymarket,
        [Source.Prediction]: SourceInURL.Prediction,
        [Source.Tokens]: SourceInURL.Tokens,
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
    // twitter -> x
    if (source === Source.Twitter) {
        return SourceInURL.X;
    }

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

export const resolveSocialSource = createLookupTableResolver<SocialSourceInURL, SocialSource>(
    {
        [SourceInURL.Farcaster]: Source.Farcaster,
        [SourceInURL.Lens]: Source.Lens,
        [SourceInURL.Twitter]: Source.Twitter,
        [SourceInURL.Bsky]: Source.Bsky,
        [SourceInURL.X]: Source.Twitter,
    },
    (sourceInUrl) => {
        throw new UnreachableError('sourceInUrl', sourceInUrl);
    },
);

export const resolveProfileSource = createLookupTableResolver<ProfileSourceInURL, ProfilePageSource>(
    {
        [SourceInURL.Farcaster]: Source.Farcaster,
        [SourceInURL.FarcasterV2]: Source.Farcaster,
        [SourceInURL.Lens]: Source.Lens,
        [SourceInURL.Bsky]: Source.Bsky,
        [SourceInURL.X]: Source.Twitter,
        [SourceInURL.Twitter]: Source.Twitter,
        [SourceInURL.Wallet]: Source.Wallet,
        [SourceInURL.WalletMix]: Source.WalletMix,
    },
    (sourceInUrl) => {
        throw new UnreachableError('sourceInUrl', sourceInUrl);
    },
);

export const resolveProfileSourceInURL = createLookupTableResolver<ProfilePageSource, ProfileSourceInURL>(
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
