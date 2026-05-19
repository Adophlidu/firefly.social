import type { SocialSource } from '@dimensiondev/enums';
import { NetworkType, SocialProfileCategory, Source, WalletProfileCategory } from '@dimensiondev/enums';

export const LOGIN_SORTED_PROFILE_TAB_TYPE: Record<SocialSource, SocialProfileCategory[]> = {
    [Source.Lens]: [
        SocialProfileCategory.Feed,
        SocialProfileCategory.Replies,
        SocialProfileCategory.Media,
        SocialProfileCategory.Collected,
    ],
    [Source.Farcaster]: [
        SocialProfileCategory.Feed,
        SocialProfileCategory.Replies,
        SocialProfileCategory.Likes,
        SocialProfileCategory.Channels,
    ],
    [Source.Twitter]: [
        SocialProfileCategory.Feed,
        SocialProfileCategory.Replies,
        SocialProfileCategory.Media,
        SocialProfileCategory.TruthSocial,
    ],
    [Source.Bsky]: [
        SocialProfileCategory.Feed,
        SocialProfileCategory.Replies,
        SocialProfileCategory.Media,
        SocialProfileCategory.Likes,
    ],
};

export const SORTED_PROFILE_TAB_TYPE: Record<SocialSource, SocialProfileCategory[]> = {
    [Source.Lens]: [
        SocialProfileCategory.Feed,
        SocialProfileCategory.Replies,
        SocialProfileCategory.Media,
        SocialProfileCategory.Collected,
    ],
    [Source.Farcaster]: [
        SocialProfileCategory.Feed,
        SocialProfileCategory.Replies,
        SocialProfileCategory.Likes,
        SocialProfileCategory.Channels,
    ],
    [Source.Twitter]: [
        SocialProfileCategory.Feed,
        SocialProfileCategory.Replies,
        SocialProfileCategory.Media,
        SocialProfileCategory.TruthSocial,
    ],
    [Source.Bsky]: [SocialProfileCategory.Feed, SocialProfileCategory.Replies, SocialProfileCategory.Media],
};

export const WALLET_PROFILE_TAB_TYPES: Record<NetworkType, WalletProfileCategory[]> = {
    [NetworkType.Ethereum]: [
        WalletProfileCategory.NFTs,
        WalletProfileCategory.Transactions,
        WalletProfileCategory.Activities,
    ],
    [NetworkType.Solana]: [WalletProfileCategory.Transactions],
};
