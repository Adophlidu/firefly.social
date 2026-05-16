import type { ArticleType } from '@dimensiondev/workers-shared/types/article.js';
import type { FireflyResponse } from '@dimensiondev/workers-shared/types/firefly.js';
import type { Address } from 'viem';

import type { FireflyDisplayInfo, FollowingSource } from '@/metadata/src/transaction/types.js';

export enum ArticlePlatform {
    Mirror = 'mirror',
    Paragraph = 'paragraph',
    Limo = 'limo',
    Matters = 'matters',
}

export interface Article {
    timestamp: string;
    hash: string;
    owner: Address;
    digest: string;
    type: ArticleType;
    platform: ArticlePlatform;
    content: {
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
