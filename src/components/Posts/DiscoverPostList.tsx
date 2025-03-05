'use client';

import { uniqBy } from 'lodash-es';
import { memo } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { HomeTab, ScrollListKey, type SocialSource, Source } from '@/constants/enum.js';
import { SOCIAL_DISCOVER_SOURCE } from '@/constants/index.js';
import { createIndicator } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useMultiInfiniteQueryPageable } from '@/hooks/useMultiInfiniteQueryPageable.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { useDiscoverStore } from '@/store/useDiscoverStore.js';

export const DiscoverPostList = memo<{ source: SocialSource | Source.Posts }>(function DiscoverPostList({ source }) {
    const sources = useDiscoverStore((state) =>
        state.postTimelinePlatforms[HomeTab.Discover].length <= 0
            ? SOCIAL_DISCOVER_SOURCE
            : SOCIAL_DISCOVER_SOURCE.filter((x) => !state.postTimelinePlatforms[HomeTab.Discover].includes(x)),
    );
    const queryResult = useMultiInfiniteQueryPageable(
        ['posts', source, 'discover', ...sources],
        sources.map((source) => ({
            key: source,
            async queryFn({ pageParam }) {
                const indicator = pageParam ? createIndicator(undefined, pageParam) : undefined;
                return resolveSocialMediaProvider(source).discoverPosts(indicator);
            },
        })),
        (data) => {
            const posts = data.pages.flatMap((page) =>
                Object.values(page)
                    ?.flatMap((pageable) => pageable.data)
                    .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)),
            );
            return uniqBy(posts, (post) => {
                if (post.mirrors?.length || post.type === 'Mirror') return `${post.postId}:mirror`;
                return post.postId;
            });
        },
    );

    return (
        <ListInPage<Post>
            source={source}
            key={source}
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Discover}:${source}`,
                computeItemKey: (index, post) => `${post.postId}-${index}`,
                itemContent: (index, post) => getPostItemContent(index, post, `${ScrollListKey.Discover}:${source}`),
            }}
            NoResultsFallbackProps={{
                className: 'md:pt-[228px] max-md:py-20',
            }}
        />
    );
});
