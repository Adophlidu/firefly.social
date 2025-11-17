'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import { useAccount } from 'wagmi';

import { ListInPage } from '@/components/ListInPage.js';
import { getSnapshotItemContent } from '@/components/VirtualList/getSnapshotItemContent.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';

export function SnapshotBookmarkList() {
    const isLogin = useIsLoginFirefly();
    const profileIds = useCurrentProfileIds();

    const query = useSuspenseInfiniteQuery({
        queryKey: ['snapshots', Source.DAOs, 'bookmark', profileIds],
        queryFn: async ({ pageParam }) => {
            if (!isLogin) return null;
            const result = await FireflySocialMediaProvider.getSnapshotBookmarks(createIndicator(undefined, pageParam));
            return result;
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return;
            return lastPage?.nextIndicator?.id;
        },
        select: (data) => compact(data.pages.flatMap((x) => x?.data)),
    });

    return (
        <ListInPage
            source={Source.DAOs}
            queryResult={query}
            loginRequired
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
            VirtualListProps={{
                listKey: `${ScrollListKey.Following}:${Source.DAOs}`,
                computeItemKey: (index, snapshot) => `${snapshot.id}-${index}`,
                itemContent: (index, snapshot) => getSnapshotItemContent(index, snapshot),
            }}
        />
    );
}
