'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { ScrollListKey } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import type { ProfileGroup } from '@/providers/types/SocialMedia.js';

interface GroupPostListProps {
    group: ProfileGroup;
}

export const GroupPostList = memo(function GroupPostList({ group }: GroupPostListProps) {
    const feedId = group.feed?.id;
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['posts', group.source, 'posts-of', feedId],
        async queryFn({ pageParam }) {
            const indicator = createIndicator(undefined, pageParam);
            if (!feedId) {
                return createPageable(EMPTY_LIST, indicator);
            }

            return LensSocialMediaProvider.getPostsByChannelId(feedId, indicator);
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage?.nextIndicator?.id,
        select: (data) => data.pages.flatMap((page) => page?.data ?? []),
    });

    const listKey = `${ScrollListKey.GroupPosts}:${group.source}:${group.id}`;

    return (
        <ListInPage
            source={group.source}
            key={group.source}
            queryResult={queryResult}
            VirtualListProps={{
                key: listKey,
                computeItemKey: (index, item) => `${item.postId}-${index}`,
                itemContent: (index, item) => getPostItemContent(index, item, listKey),
            }}
            NoResultsFallbackProps={{
                className: 'md:pt-[228px] max-md:py-20',
            }}
        />
    );
});
