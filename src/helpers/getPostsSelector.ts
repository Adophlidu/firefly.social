import type { InfiniteData } from '@tanstack/react-query';
import { uniqBy } from 'lodash-es';

import type { SocialSource } from '@/constants/enum.js';
import { mergeThreadPosts, mergeThreadPostsWithoutSource } from '@/helpers/mergeThreadPosts.js';
import type { Pageable, PageIndicator } from '@/helpers/pageable.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function getPostsSelector(source: SocialSource) {
    return (data: InfiniteData<Pageable<Post, PageIndicator | undefined> | undefined, string>) => {
        return mergeThreadPosts(
            source,
            uniqBy(
                data.pages.flatMap((x) => x?.data || []),
                (post) => {
                    if (post.mirrors?.length || post.type === 'Mirror') return `${post.postId}:mirror`;
                    return post.postId;
                },
            ),
        );
    };
}

export function getPostsSelectorWithoutSource(
    data: InfiniteData<Pageable<Post, PageIndicator | undefined> | undefined, string>,
) {
    const posts = uniqBy(
        data.pages.flatMap((x) => x?.data || []),
        (post) => {
            if (post.mirrors?.length || post.type === 'Mirror') return `${post.postId}:mirror`;
            return post.postId;
        },
    );
    return mergeThreadPostsWithoutSource(posts);
}
