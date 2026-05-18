import type { ArticlePlatform, ArticleType } from '@dimensiondev/enums';
import type { Address } from 'viem';

export enum WatchType {
    Wallet = 'wallet',
    SolanaWallet = 'solana',
    MaskX = 'maskx',
    Twitter = 'twitter',
    Lens = 'lens',
    Farcaster = 'farcaster',
}

export interface FollowingSource {
    id?: string;
    handle?: string;
    name?: string;
    type: WatchType;
    socialId?: string;
    walletAddress?: `0x${string}`;
}

export interface FireflyDisplayInfo {
    ensHandle: string;
    avatarUrl: string;
    fireflyName: string;
    fireflyUid: string;
    fireflyAvatarUrl: string;
}

export interface Article {
    platform: ArticlePlatform;
    title: string;
    content: string;
    type: ArticleType;
    hash: string;
    author: {
        handle: string;
        avatar: string;
        /** Wallet address */
        id: Address;
        isFollowing: boolean;
        /** Article in timeline are all not muted */
        isMuted: boolean;
        username: string;
        displayName: string;
        info: {
            ethAddress: string;
        };
    };
    displayInfo: FireflyDisplayInfo;
    origin?: string;
    timestamp: string;
    id: string;
    coverUrl: string | null;
    hasBookmarked?: boolean;
    slug?: string;
    followingSources: FollowingSource[];

    // Paragraph only
    html?: string;
    json?: string;

    // Matters only
    likeCount?: number;
}
