'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { ListInPage } from '@/components/ListInPage.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { ScrollListKey, type SocialSource, Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { mergeThreadPosts } from '@/helpers/mergeThreadPosts.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import type { Channel, Post } from '@/providers/types/SocialMedia.js';

interface PostListProps {
    channel: Channel;
    source: SocialSource;
}

export function PostList({ channel, source }: PostListProps) {
    const channelId = channel.id;
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['posts', source, 'posts-of', channelId],
        queryFn: async ({ pageParam }) => {
            const id = source === Source.Lens ? channel.feedId : channelId;
            if (!id) return createPageable<Post>(EMPTY_LIST, createIndicator());

            const provider = resolveSocialMediaProvider(source);
            const posts = await provider.getPostsByChannelId(id, createIndicator(undefined, pageParam));

            return posts;
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) =>
            mergeThreadPosts(
                source,
                // The timeline api will not return a blocked status for the channel.
                data.pages.flatMap((x) => x.data).map((x) => ({ ...x, channel })),
            ),
    });

    return (
        <ListInPage
            source={source}
            key={source}
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Channel}:${channelId}`,
                computeItemKey: (index, post) => `${post.postId}-${index}`,
                itemContent: (index, post) => getPostItemContent(index, post, `${ScrollListKey.Channel}:${channelId}`),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
