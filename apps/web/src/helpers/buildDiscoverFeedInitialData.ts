import { PostType } from '@dimensiondev/enums';
import type { Pageable, PageIndicator } from '@dimensiondev/utils';
import type { InfiniteData } from '@tanstack/react-query';
import { uniqBy } from 'lodash-es';

import { SSR_LIST_LIMIT } from '@/constants/ssr.js';
import { compactPostsForPageTransfer } from '@/helpers/compactPostForPageTransfer.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export type DiscoverFeedInitialData = InfiniteData<Pageable<Post, PageIndicator>, string>;

export function buildDiscoverFeedInitialData(
    page: Pageable<Post, PageIndicator>,
    initialPageParam: string,
): DiscoverFeedInitialData | undefined {
    if (!page.data.length) return undefined;

    const posts = uniqBy(
        page.data.concat().sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)),
        (post) => {
            if (post.mirrors?.length || post.type === PostType.Mirror) return `${post.postId}:mirror`;
            return post.postId;
        },
    );

    return {
        pages: [
            {
                ...page,
                data: compactPostsForPageTransfer(posts.slice(0, SSR_LIST_LIMIT)),
            },
        ],
        pageParams: [initialPageParam],
    };
}
