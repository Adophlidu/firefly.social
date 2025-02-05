'use client';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { ListInPage } from '@/components/ListInPage.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { BskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';

export function TrendingPostsFullList() {
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['trending-posts', Source.Bsky],
        queryFn: ({ pageParam }) => BskySocialMediaProvider.discoverPosts(createIndicator(undefined, pageParam)),
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => data.pages.flatMap((x) => x.data),
    });

    const source = Source.Bsky;

    return (
        <ListInPage
            source={source}
            key={source}
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.TrendingFeeds}:${source}`,
                computeItemKey: (index, post) => `${post.postId}-${index}`,
                itemContent: (index, post) => getPostItemContent(index, post, `${ScrollListKey.Discover}:${source}`),
            }}
            NoResultsFallbackProps={{
                className: 'md:pt-[228px] max-md:py-20',
            }}
        />
    );
}
