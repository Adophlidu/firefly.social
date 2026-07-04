'use client';

import ProtectedIcon from '@dimensiondev/assets/protected.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { SUPPORTED_PINNED_POST_SOURCES } from '@dimensiondev/constants/computed';
import type { SocialSource } from '@dimensiondev/enums';
import { ScrollListKey, Source } from '@dimensiondev/enums';
import { createIndicator, createPageable } from '@dimensiondev/utils';
import { useQuery, useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { useContext } from 'react';

import { ProtectedPostsMessage } from '@/components/fallbacks/ProtectedPostsMessage.js';
import { ListInPage } from '@/components/ListInPage.js';
import { pinnedPostQueryOptions } from '@/components/Posts/queries/pinnedPostQueryOptions.js';
import { ProfileContext } from '@/components/Profile/ProfileContext.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { SSR_LIST_LIMIT } from '@/constants/ssr.js';
import { getPostsSelector } from '@/helpers/getPostsSelector.js';
import { isSamePost } from '@/helpers/isSamePost.js';
import { resolveProviderOptions, resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useAsyncStatus } from '@/hooks/useAsyncStatus.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useIsProfileProtected } from '@/hooks/useIsProfileProtected.js';
import { useRefetchWhenReady } from '@/hooks/useRefetchWhenReady.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface FeedListProps {
    profileId: string;
    source: SocialSource;
}

export function FeedList({ profileId, source }: FeedListProps) {
    const { initialFeedPage } = useContext(ProfileContext);
    const isLogin = useIsLogin(source);
    const isProtected = useIsProfileProtected(source, profileId);
    // Twitter API might returns incomplete data, so only force it when the user protects his account
    const forceTwitterOfficial = isLogin && isProtected;

    const { data: pinnedPost } = useQuery({
        ...pinnedPostQueryOptions(source, profileId),
        enabled: SUPPORTED_PINNED_POST_SOURCES.includes(source) && !!profileId,
    });

    // The viewer's session (and its provider client) resumes asynchronously after first
    // paint; `isSyncing` is true until that completes.
    const isSyncing = useAsyncStatus(source);

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['posts', source, 'posts-of', profileId, forceTwitterOfficial],
        queryFn: async ({ pageParam }) => {
            if (!profileId) return createPageable<Post>(EMPTY_LIST, createIndicator());

            const provider = resolveSocialMediaProvider(
                source,
                resolveProviderOptions(source, pageParam) ?? {
                    [Source.Twitter]: forceTwitterOfficial ? 'twitter' : undefined,
                },
            );
            const pageIndicator = createIndicator(undefined, pageParam);
            const posts = await provider.getPostsByProfileId(profileId, pageIndicator);

            return posts;
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return;
            return lastPage?.nextIndicator?.id;
        },
        select: (data) => {
            const posts = getPostsSelector(source)(data);
            return pinnedPost ? posts.filter((post) => !isSamePost(post, pinnedPost)) : posts;
        },
        initialData: forceTwitterOfficial ? undefined : initialFeedPage,
    });

    // The first page may be server-rendered anonymously (see getProfilePageData): it carries
    // no viewer relationship (hasLiked, …) and is sliced to SSR_LIST_LIMIT items while keeping
    // the full page's cursor — paginating from it would skip the items beyond the slice.
    // Refetch once sessions have finished resuming — for anonymous viewers too when the list
    // was seeded with the sliced SSR page — to replace it with the complete first page.
    const seededWithSlicedPage = !forceTwitterOfficial && !!initialFeedPage;
    useRefetchWhenReady((isLogin || seededWithSlicedPage) && !isSyncing, queryResult.refetch);

    return (
        <ListInPage
            source={source}
            key={source}
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Profile}:${profileId}`,
                // Render the first screen of posts during SSR. Without this react-virtuoso
                // emits an empty list on the server (it measures in the browser), so the
                // server-prefetched timeline would never reach the initial HTML.
                initialItemCount: Math.min(queryResult.data.length, SSR_LIST_LIMIT),
                computeItemKey: (index, post) => `${post.publicationId}-${post.postId}-${index}`,
                itemContent: (index, post) => getPostItemContent(index, post, `${ScrollListKey.Profile}:${profileId}`),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
                icon: isProtected ? <ProtectedIcon width={190} height={50} className="text-third" /> : undefined,
                message: isProtected ? <ProtectedPostsMessage /> : undefined,
            }}
        />
    );
}
