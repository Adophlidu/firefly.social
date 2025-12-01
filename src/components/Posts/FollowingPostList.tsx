'use client';

import { Trans } from '@lingui/react/macro';
import { uniqBy } from 'lodash-es';
import { memo, useMemo } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { Loading } from '@/components/Loading.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { HomeTab, ScrollListKey, type SocialDiscoverSource, Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { mergeThreadPostsWithoutSource } from '@/helpers/mergeThreadPosts.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useDiscoverSources } from '@/hooks/useDiscoverSources.js';
import { useMultiInfiniteQueryPageable } from '@/hooks/useMultiInfiniteQueryPageable.js';
import { useSocialDiscoverSourcesWithWhitelist } from '@/hooks/useSocialDiscoverSourcesWithWhitelist.js';

function useIsLoginDiscoverNeed(source: SocialDiscoverSource | Source.Posts) {
    const profilesAll = useCurrentProfilesAll();
    const sources = useSocialDiscoverSourcesWithWhitelist(HomeTab.Following);

    return useMemo(() => {
        if (source !== Source.Posts) return !!profilesAll[source]?.profileId;
        return sources.some((x) => !!profilesAll[x]?.profileId);
    }, [sources, source, profilesAll]);
}

export const FollowingPostList = memo<{
    source: SocialDiscoverSource | Source.Posts;
}>(function FollowingPostList({ source }) {
    const isLogin = useIsLoginDiscoverNeed(source);
    const profilesAll = useCurrentProfilesAll();
    const asyncStatusAll = useAsyncStatusAll();
    const { sources, selectedSources } = useDiscoverSources(HomeTab.Following);
    const queryResult = useMultiInfiniteQueryPageable(
        ['posts', source, 'following', isLogin, asyncStatusAll, ...sources, ...selectedSources],
        sources.map((source) => ({
            key: source,
            async queryFn({ pageParam, signal }) {
                const indicator = createIndicator(undefined, pageParam);
                if (!isLogin) return createPageable(EMPTY_LIST, indicator);
                const profile = profilesAll[source];
                if (!profile?.profileId) return createPageable(EMPTY_LIST, indicator);
                const provider = resolveSocialMediaProvider(source);
                return provider.discoverPostsById(profile.profileId, pageParam ? indicator : undefined, signal);
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
        {
            gcTime: 10 * 60 * 1000,
            staleTime: 10 * 60 * 1000,
        },
    );

    if (!isLogin) return <NotLoginFallback source={Source.Posts} />;
    if (asyncStatusAll || (queryResult?.isRefetching && !queryResult.data?.length)) return <Loading />;

    return (
        <ListInPage
            source={source}
            key={source}
            queryResult={queryResult}
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
