'use client';

import { EMPTY_LIST } from '@dimensiondev/constants';
import type { SocialSource } from '@dimensiondev/enums';
import { ScrollListKey, Source } from '@dimensiondev/enums';
import { createIndicator, createPageable } from '@dimensiondev/utils';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { ListInPage } from '@/components/ListInPage.js';
import { OrbTimelineCell } from '@/components/Posts/OrbTimelineCell.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { isLpt1Post } from '@/helpers/lpt1.js';
import { mergeThreadPosts } from '@/helpers/mergeThreadPosts.js';
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

    const listKey = `${ScrollListKey.Channel}:${channelId}`;

    return (
        <ListInPage
            source={source}
            key={source}
            queryResult={queryResult}
            VirtualListProps={{
                listKey,
                computeItemKey: (index, post) => `${post.postId}-${index}`,
                // Orb (LPT-1) posts render via OrbTimelineCell so the position pill +
                // sport/match card show up; everything else stays on the generic cell.
                // eslint-disable-next-line react/no-unstable-nested-components -- render prop, not a component
                itemContent: (index, post) =>
                    isLpt1Post(post.metadata.tags) ? (
                        <OrbTimelineCell key={post.postId} post={post} listKey={listKey} index={index} />
                    ) : (
                        getPostItemContent(index, post, listKey)
                    ),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
