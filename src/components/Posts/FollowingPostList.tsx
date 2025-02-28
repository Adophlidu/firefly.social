'use client';

import { Trans } from '@lingui/react/macro';
import { uniqBy } from 'lodash-es';
import { memo, useMemo } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { ScrollListKey, type SocialDiscoverSource, Source } from '@/constants/enum.js';
import { EMPTY_LIST, SOCIAL_DISCOVER_SOURCE } from '@/constants/index.js';
import { mergeThreadPostsWithoutSource } from '@/helpers/mergeThreadPosts.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useCurrentProfileAll } from '@/hooks/useCurrentProfile.js';
import { useMultiInfiniteQueryPageable } from '@/hooks/useMultiInfiniteQueryPageable.js';
import { useDiscoverStore } from '@/store/useDiscoverStore.js';

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

    const sources = useDiscoverStore((state) =>
        state.enabledFilterPlatform
            ? SOCIAL_DISCOVER_SOURCE.filter((x) => !state.filteredPlatforms.includes(x))
            : SOCIAL_DISCOVER_SOURCE,
    );

    const queryResult = useMultiInfiniteQueryPageable(
        ['posts', source, 'following', isLogin, ...sources],
        sources.map((source) => ({
            key: source,
            async queryFn({ pageParam }) {
                const indicator = createIndicator(undefined, pageParam);
                if (!isLogin) return createPageable(EMPTY_LIST, indicator);
                const profile = currentProfileAll[source];
                if (!profile?.profileId) return createPageable(EMPTY_LIST, indicator);
                return resolveSocialMediaProvider(source).discoverPostsById(profile.profileId, indicator);
            },
        })),
        (data) => {
            const posts = data.pages.flatMap((page) =>
                Object.values(page)
                    ?.flatMap((pageable) => pageable.data)
                    .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)),
            );
            const uniqPosts = uniqBy(posts, (post) => {
                if (post.mirrors?.length || post.type === 'Mirror') return `${post.postId}:mirror`;
                return post.postId;
            });
            return mergeThreadPostsWithoutSource(uniqPosts);
        },
    );

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
