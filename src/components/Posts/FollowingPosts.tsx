'use client';

import { Trans } from '@lingui/react/macro';
import { uniqBy } from 'lodash-es';
import { memo, useState } from 'react';
import { useTimeout } from 'usehooks-ts';

import { ListInPage } from '@/components/ListInPage.js';
import { Loading } from '@/components/Loading.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/computed.js';
import { AsyncStatus, HomeTab, ScrollListKey, Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { getProfileStoreStatusFromStorage } from '@/helpers/getProfileStoreStatusFromStorage.js';
import { getSessionFromStorageBySource } from '@/helpers/getSessionFromStorage.js';
import { mergeThreadPostsWithoutSource } from '@/helpers/mergeThreadPosts.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useDiscoverSources } from '@/hooks/useDiscoverSources.js';
import { useIsLoginDiscoverSource } from '@/hooks/useIsLogin.js';
import { useMultiInfiniteQueryPageable } from '@/hooks/useMultiInfiniteQueryPageable.js';
import { useDiscoverStoreWithTab } from '@/store/useDiscoverStore.js';

const FollowingPostsTimeline = memo(function FollowingPostsTimeline() {
    const { sources } = useDiscoverSources(HomeTab.Following);
    const profilesAll = useCurrentProfilesAll();

    const extraKeys = SORTED_SOCIAL_SOURCES.map((x) => (sources.includes(x) ? profilesAll[x]?.profileId : null) || '-');
    const queryResult = useMultiInfiniteQueryPageable(
        ['posts', Source.Posts, 'following', ...extraKeys],
        sources.map((source) => ({
            key: source,
            async queryFn({ pageParam, signal }) {
                const indicator = createIndicator(undefined, pageParam);
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
            staleTime: 5 * 60 * 1000,
        },
    );

    return (
        <ListInPage
            source={Source.Posts}
            key={Source.Posts}
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Following}:${Source.Posts}`,
                computeItemKey: (index, post) => `${post.postId}-${index}`,
                itemContent: (index, post) =>
                    getPostItemContent(index, post, `${ScrollListKey.Following}:${Source.Posts}`),
            }}
            NoResultsFallbackProps={{
                className: 'md:pt-[228px] max-md:py-20',
                message: (
                    <div className="mt-10">
                        <Trans>Follow more friends to continue exploring on {resolveSourceName(Source.Posts)}.</Trans>
                    </div>
                ),
            }}
        />
    );
});

export const FollowingPosts = memo(function FollowingPosts() {
    const asyncStatusAll = useAsyncStatusAll();
    const isLogin = useIsLoginDiscoverSource();
    const { setFilteredPlatform } = useDiscoverStoreWithTab(HomeTab.Following);
    const [forceRender, setForceRender] = useState(false);

    /**
     * After 3 seconds, automatically select all logged-in sources except Twitter
     * And no need to wait for all profile store loading completion
     */
    useTimeout(() => {
        if (!isLogin || !asyncStatusAll) return;

        const selectedSources = SORTED_SOCIAL_SOURCES.filter((x) => {
            const session = getSessionFromStorageBySource(x);
            if (!session) return false;

            const status = getProfileStoreStatusFromStorage(x);
            return status === AsyncStatus.Idle;
        });
        if (selectedSources.length) {
            setFilteredPlatform(selectedSources);
            setForceRender(true);
        }
    }, 3000);

    if (asyncStatusAll && !forceRender) return <Loading />;
    if (!isLogin) return <NotLoginFallback source={Source.Posts} />;

    return <FollowingPostsTimeline />;
});
