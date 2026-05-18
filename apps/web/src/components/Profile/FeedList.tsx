'use client';

import ProtectedIcon from '@dimensiondev/assets/protected.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import type { SocialSource } from '@dimensiondev/enums';
import { ScrollListKey, Source } from '@dimensiondev/enums';
import { createIndicator, createPageable } from '@dimensiondev/utils';
import { useQuery, useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { ProtectedPostsMessage } from '@/components/fallbacks/ProtectedPostsMessage.js';
import { ListInPage } from '@/components/ListInPage.js';
import { pinnedPostQueryOptions } from '@/components/Posts/queries/pinnedPostQueryOptions.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { getPostsSelector } from '@/helpers/getPostsSelector.js';
import { isSamePost } from '@/helpers/isSamePost.js';
import { resolveProviderOptions, resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useIsProfileProtected } from '@/hooks/useIsProfileProtected.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface FeedListProps {
    profileId: string;
    source: SocialSource;
}

export function FeedList({ profileId, source }: FeedListProps) {
    const isLogin = useIsLogin(source);
    const isProtected = useIsProfileProtected(source, profileId);
    // Twitter API might returns incomplete data, so only force it when the user protects his account
    const forceTwitterOfficial = isLogin && isProtected;

    const { data: pinnedPost } = useQuery({
        ...pinnedPostQueryOptions(source, profileId),
        enabled: source === Source.Twitter && !!profileId,
    });

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
        select: getPostsSelector(source),
    });

    return (
        <ListInPage
            source={source}
            key={source}
            queryResult={{
                ...queryResult,
                data:
                    pinnedPost && isSamePost(queryResult.data?.[0], pinnedPost)
                        ? queryResult.data?.slice(1)
                        : queryResult.data,
            }}
            VirtualListProps={{
                listKey: `${ScrollListKey.Profile}:${profileId}`,
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
