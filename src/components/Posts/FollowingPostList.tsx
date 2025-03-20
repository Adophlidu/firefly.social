'use client';

import { Trans } from '@lingui/react/macro';
import { uniqBy } from 'lodash-es';
import { memo, useMemo } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { Loading } from '@/components/Loading.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { HomeTab, ScrollListKey, type SocialDiscoverSource, Source } from '@/constants/enum.js';
import { EMPTY_LIST, SOCIAL_DISCOVER_SOURCE } from '@/constants/index.js';
import { mergeThreadPostsWithoutSource } from '@/helpers/mergeThreadPosts.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useDiscoverSources } from '@/hooks/useDiscoverSources.js';
import { useMultiInfiniteQueryPageable } from '@/hooks/useMultiInfiniteQueryPageable.js';

function useIsLoginDiscoverNeed(source: SocialDiscoverSource | Source.Posts) {
    const profilesAll = useCurrentProfilesAll();

    return useMemo(() => {
        if (source !== Source.Posts) return !!profilesAll[source]?.profileId;
        return SOCIAL_DISCOVER_SOURCE.some((x) => !!profilesAll[x]?.profileId);
    }, [source, profilesAll]);
}

export const FollowingPostList = memo<{
    source: SocialDiscoverSource | Source.Posts;
}>(function FollowingPostList({ source }) {
    const isLogin = useIsLoginDiscoverNeed(source);
    const profilesAll = useCurrentProfilesAll();
    const asyncStatusAll = useAsyncStatusAll();
    const sources = useDiscoverSources(HomeTab.Following);
    const queryResult = useMultiInfiniteQueryPageable(
        ['posts', source, 'following', isLogin, asyncStatusAll, ...sources],
        sources.map((source) => ({
            key: source,
            async queryFn({ pageParam }) {
                const indicator = createIndicator(undefined, pageParam);
                if (!isLogin) return createPageable(EMPTY_LIST, indicator);
                const profile = profilesAll[source];
                if (!profile?.profileId) return createPageable(EMPTY_LIST, indicator);
                return resolveSocialMediaProvider(source).discoverPostsById(
                    profile.profileId,
                    pageParam ? indicator : undefined,
                );
            },
        })),
        (data) => {
            const posts = data.pages.flatMap((page) =>
                page.data.concat().sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)),
            );
            const uniqPosts = uniqBy(posts, (post) => {
                if (post.mirrors?.length || post.type === 'Mirror') return `${post.postId}:mirror`;
                return post.postId;
            });
            return mergeThreadPostsWithoutSource(uniqPosts);
        },
    );

    if (asyncStatusAll) {
        return <Loading />;
    }

    return (
        <ListInPage
            source={source}
            key={source}
            queryResult={queryResult}
            loginRequired={!isLogin}
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
