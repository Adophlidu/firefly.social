'use client';

import MessagesIcon from '@dimensiondev/assets/messages.svg';
import { ScrollListKey, Source } from '@dimensiondev/enums';
import { createIndicator } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { OrbTimelineCell } from '@/components/Posts/OrbTimelineCell.js';
import { getLensWorldCupPosts } from '@/providers/lens/getLensWorldCupPosts.js';

export const WorldCupTimeline = memo(function WorldCupTimeline() {
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['posts', Source.Lens, 'orb-timeline'],
        queryFn: ({ pageParam }) => getLensWorldCupPosts(createIndicator(undefined, pageParam)),
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => data.pages.flatMap((x) => x.data),
    });

    return (
        <ListInPage
            source={Source.Lens}
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Discover}:world-cup`,
                computeItemKey: (index, post) => `${post.postId}-${index}`,
                // eslint-disable-next-line react/no-unstable-nested-components -- render prop, not a component
                itemContent: (_index, post) => <OrbTimelineCell key={post.postId} post={post} />,
            }}
            NoResultsFallbackProps={{
                icon: <MessagesIcon width={24} height={24} />,
                message: <Trans>No comments yet. Be the first to post!</Trans>,
            }}
        />
    );
});
