import type { ArticlePlatform, ArticleType, WatchType } from '@dimensiondev/enums';
import type { FireflyResponse } from '@dimensiondev/workers-shared/types/firefly.js';

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
    timestamp: string;
    hash: string;
    owner: `0x${string}`;
    digest: string;
    type: ArticleType;
    platform: ArticlePlatform;
    content: {
        body: string;
        title: string;
    };
    contents?: {
        body: string;
        title: string;
    };
    author: string;
    displayInfo: FireflyDisplayInfo;
    authorship: {
        id: string;
        avatar: string;
        userName: string;
        displayName: string;
        info: {
            ethAddress: string;
        };
    } | null;
    related_urls: string[];
    article_id: string;
    cover_img_url: string | null;
    has_bookmarked?: boolean;
    followingSources: FollowingSource[];
    paragraph_raw_data?: {
        slug: string;
        staticHtml: string;
        json: string;
    };
    custom_payload?: {
        posts?: {
            postId: string;
            platform: string;
        };
    };
}

export type GetArticleDetailResponse = FireflyResponse<Article[]>;
