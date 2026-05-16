export const enum NetworkType {
    Ethereum = 'ethereum',
    Solana = 'solana',
}

export const enum FollowCategory {
    Following = 'following',
    Followers = 'followers',
    Mutuals = 'mutuals',
}

export enum SocialProfileCategory {
    Feed = 'feed',
    Replies = 'replies',
    Likes = 'likes',
    Media = 'media',
    Collected = 'collected',
    Channels = 'channels',
    TruthSocial = 'truth-social',
}

export enum WalletProfileCategory {
    NFTs = 'nfts',
    Activities = 'activities',
    Transactions = 'transactions',
}

export type ProfileCategory = FollowCategory | SocialProfileCategory | WalletProfileCategory;
