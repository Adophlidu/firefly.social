'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { ScrollListKey, type SocialSource, Source } from '@/constants/enum.js';
import { SOCIAL_DISCOVER_SOURCE } from '@/constants/index.js';
import { getPostsSelector, getPostsSelectorWithoutSource } from '@/helpers/getPostsSelector.js';
import { multiQueryPageable } from '@/helpers/multiQueryPageable.js';
import { createIndicator, type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { sortMultiSourcePosts } from '@/helpers/sortMultiSourcePosts.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { useImpressionsStore } from '@/store/useImpressionsStore.js';

async function discoverPosts(
    source: SocialSource | Source.Posts,
    indicator: PageIndicator,
): Promise<Pageable<Post, PageIndicator>> {
    if (source === Source.Posts) {
        const pageable = await multiQueryPageable(
            SOCIAL_DISCOVER_SOURCE,
            async (source, indicatorId) => {
                return resolveSocialMediaProvider(source).discoverPosts(createIndicator(undefined, indicatorId ?? ''));
            },
            indicator,
        );
        return {
            ...pageable,
            data: sortMultiSourcePosts(pageable.data),
        };
    }
    const provider = resolveSocialMediaProvider(source);
    return provider.discoverPosts(indicator);
}

export const DiscoverPostList = memo<{ source: SocialSource | Source.Posts }>(function DiscoverPostList({ source }) {
    const fetchAndStoreViews = useImpressionsStore.use.fetchAndStoreViews();
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['posts', source, 'discover'],
        networkMode: 'always',

        queryFn: async ({ pageParam }) => {
            const posts = await discoverPosts(source, createIndicator(undefined, pageParam));
            if (source === Source.Lens) fetchAndStoreViews(posts.data.flatMap((x) => [x.postId]));
            return posts;
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => {
            if (source === Source.Posts) return getPostsSelectorWithoutSource(data);
            return getPostsSelector(source)(data);
        },
    });

    return (
        <ListInPage
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
