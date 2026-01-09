import { type Address } from 'viem';

import { type FireflyDisplayInfo, type FollowingSource } from '@/providers/types/Firefly.js';

export enum ArticlePlatform {
    Mirror = 'mirror',
    Paragraph = 'paragraph',
    Limo = 'limo',
    Matters = 'matters',
}

export enum ArticleType {
    Post = 'post',
    Revise = 'revise',
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
    isLiked?: boolean;
    likeCount?: number;

    // Paragraph only
    html?: string;
    json?: string;

    // Matters only
    htmlContent?: string;
}
