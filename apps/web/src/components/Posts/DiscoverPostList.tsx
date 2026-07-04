'use client';

import { HomeTab, PostType, ScrollListKey, type SocialSource, type Source } from '@dimensiondev/enums';
import { useMultiInfiniteQueryPageable } from '@dimensiondev/hooks';
import { createIndicator } from '@dimensiondev/utils';
import { uniqBy } from 'lodash-es';
import { memo } from 'react';

import type { DiscoverFeedInitialData } from '@/app/[locale]/(normal)/(home)/(discover)/posts/getDiscoverPostsPageData.js';
import { ListInPage } from '@/components/ListInPage.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { SSR_LIST_LIMIT } from '@/constants/ssr.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useDiscoverSources } from '@/hooks/useDiscoverSources.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useRefetchWhenReady } from '@/hooks/useRefetchWhenReady.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export const DiscoverPostList = memo<{
    source: SocialSource | Source.Posts;
    initialFeedPage?: DiscoverFeedInitialData;
}>(function DiscoverPostList({ source, initialFeedPage }) {
    const { sources, selectedSources } = useDiscoverSources(HomeTab.Discover);
    const isLogin = useIsLogin();
    const hasSourceFilter = selectedSources.length > 0;
    // The viewer's sessions resume asynchronously after first paint; true until they finish.
    const isSyncing = useAsyncStatusAll();
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
                if (post.mirrors?.length || post.type === PostType.Mirror) return `${post.postId}:mirror`;
                return post.postId;
            });
        },
        {
            gcTime: 10 * 60 * 1000,
            initialData: hasSourceFilter ? undefined : initialFeedPage,
        },
    );

    // The first page may be server-rendered anonymously (see getDiscoverPostsPageData): it
    // carries no viewer relationship (hasLiked, …) and is sliced to SSR_LIST_LIMIT items while
    // keeping the full page's cursor — paginating from it would skip the items beyond the
    // slice. Refetch once sessions have finished resuming — for anonymous viewers too when the
    // list was seeded with the sliced SSR page — to replace it with the complete first page.
    const seededWithSlicedPage = !hasSourceFilter && !!initialFeedPage;
    useRefetchWhenReady((isLogin || seededWithSlicedPage) && !isSyncing, queryResult.refetch);

    return (
        <ListInPage<Post>
            source={source}
            key={source}
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Discover}:${source}`,
                // Render the first screen during SSR; without it react-virtuoso emits an
                // empty list on the server and the prefetched feed never reaches the HTML.
                initialItemCount: Math.min(queryResult.data.length, SSR_LIST_LIMIT),
                computeItemKey: (index, post) => `${post.postId}-${index}`,
                itemContent: (index, post) => getPostItemContent(index, post, `${ScrollListKey.Discover}:${source}`),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
});
