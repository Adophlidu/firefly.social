'use client';

import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { memo, useMemo } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { ScrollListKey, type SocialDiscoverSource, type SocialSource, Source } from '@/constants/enum.js';
import { EMPTY_LIST, SOCIAL_DISCOVER_SOURCE, SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { getPostsSelector, getPostsSelectorWithoutSource } from '@/helpers/getPostsSelector.js';
import { multiQueryPageable } from '@/helpers/multiQueryPageable.js';
import { createIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { sortMultiSourcePosts } from '@/helpers/sortMultiSourcePosts.js';
import { useCurrentProfileAll } from '@/hooks/useCurrentProfile.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { useImpressionsStore } from '@/store/useImpressionsStore.js';

async function discoverPostsById(
    source: SocialSource | Source.Posts,
    profileAll: Record<SocialSource, Profile | null>,
    indicator: PageIndicator,
) {
    if (source === Source.Posts) {
        const pageable = await multiQueryPageable(
            SOCIAL_DISCOVER_SOURCE.filter((x) => profileAll[x]),
            async (source, indicatorId) => {
                const profile = profileAll[source]!;
                return resolveSocialMediaProvider(source).discoverPostsById(
                    profile?.profileId,
                    createIndicator(undefined, indicatorId ?? ''),
                );
            },
            indicator,
        );
        return {
            ...pageable,
            data: sortMultiSourcePosts(pageable.data),
        };
    }
    const provider = resolveSocialMediaProvider(source);
    const profile = profileAll[source];
    if (!profile) return createPageable(EMPTY_LIST, indicator);
    return provider.discoverPostsById(profile.profileId, indicator);
}

function useIsLoginDiscoverNeed(source: SocialDiscoverSource | Source.Posts) {
    const currentProfileAll = useCurrentProfileAll();

    return useMemo(() => {
        if (source !== Source.Posts) return !!currentProfileAll[source]?.profileId;
        return SOCIAL_DISCOVER_SOURCE.some((x) => !!currentProfileAll[x]?.profileId);
    }, [source, currentProfileAll]);
}

export const FollowingPostList = memo<{
    source: SocialDiscoverSource | Source.Posts;
}>(function FollowingPostList({ source }) {
    const isLogin = useIsLoginDiscoverNeed(source);

    const currentProfileAll = useCurrentProfileAll();
    const fetchAndStoreViews = useImpressionsStore.use.fetchAndStoreViews();

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: [
            'posts',
            source,
            'following',
            isLogin,
            SORTED_SOCIAL_SOURCES.map((x) => currentProfileAll[x]?.profileId),
        ],
        queryFn: async ({ pageParam }) => {
            if (!isLogin) return;
            const posts = await discoverPostsById(source, currentProfileAll, createIndicator(undefined, pageParam));
            if (source === Source.Lens) {
                const ids = posts.data.flatMap((x) => [x.postId]);
                fetchAndStoreViews(ids);
            }
            return posts;
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return;
            return lastPage?.nextIndicator?.id;
        },
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
            loginRequired
            VirtualListProps={{
                listKey: `${ScrollListKey.Following}:${source}`,
                computeItemKey: (index, post) => `${post.postId}-${index}`,
                itemContent: (index, post) => getPostItemContent(index, post, `${ScrollListKey.Following}:${source}`),
            }}
            NoResultsFallbackProps={{
                className: 'md:pt-[228px] max-md:py-20',
                message: (
                    <div className="mt-10">
                        <Trans>Follow more friends to continue exploring on {resolveSourceName(source)}.</Trans>
                    </div>
                ),
            }}
        />
    );
});
