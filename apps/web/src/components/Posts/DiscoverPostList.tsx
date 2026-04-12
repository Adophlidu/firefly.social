'use client';

import { uniqBy } from 'lodash-es';
import { memo } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { HomeTab, ScrollListKey, type SocialSource, type Source } from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useDiscoverSources } from '@/hooks/useDiscoverSources.js';
import { useMultiInfiniteQueryPageable } from '@/hooks/useMultiInfiniteQueryPageable.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export const DiscoverPostList = memo<{ source: SocialSource | Source.Posts }>(function DiscoverPostList({ source }) {
    const { sources, selectedSources } = useDiscoverSources(HomeTab.Discover);
    const queryResult = useMultiInfiniteQueryPageable(
        ['posts', source, 'discover', ...selectedSources],
        sources.map((source) => ({
            key: source,
            async queryFn({ pageParam }) {
                const indicator = pageParam ? createIndicator(undefined, pageParam) : undefined;
                return resolveSocialMediaProvider(source).discoverPosts(indicator);
            },
        })),
        (data) => {
            const posts = data.pages.flatMap((page) =>
                page.data.concat().sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)),
            );
            return uniqBy(posts, (post) => {
                if (post.mirrors?.length || post.type === 'Mirror') return `${post.postId}:mirror`;
                return post.postId;
            });
        },
        {
            gcTime: 10 * 60 * 1000,
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
                className: 'mt-20',
            }}
        />
    );
});
