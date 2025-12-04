'use client';

import { useSuspenseInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query';

import ProtectedIcon from '@/assets/protected.svg';
import { ListInPage } from '@/components/ListInPage.js';
import { getPostItemContent } from '@/components/VirtualList/getPostItemContent.js';
import { ScrollListKey, type SocialSource, Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { getPostsSelector } from '@/helpers/getPostsSelector.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface FeedListProps {
    profileId: string;
    source: SocialSource;
}

export function FeedList({ profileId, source }: FeedListProps) {
    const isLogin = useIsLogin(source);
    const { data: profile } = useSuspenseQuery({
        queryKey: ['profile-protected', source, profileId, isLogin],
        queryFn: async () => {
            // Querying protected flag for Twitter
            if (source !== Source.Twitter) return null;

            const provider = resolveSocialMediaProvider(source);
            const profile = await provider.getProfileById(profileId);
            return provider.getProfileByHandle(profile.handle);
        },
    });
    const isProtected = profile?.protected;
    // Twitter API might returns incomplete data, so only force it when the user protects his account
    const forceTwitterOfficial = isLogin && isProtected;

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['posts', source, 'posts-of', profileId, forceTwitterOfficial],

        queryFn: async ({ pageParam }) => {
            if (!profileId) return createPageable<Post>(EMPTY_LIST, createIndicator());

            const provider = resolveSocialMediaProvider(source, {
                [Source.Twitter]: forceTwitterOfficial ? 'twitter' : undefined,
            });
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
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Profile}:${profileId}`,
                computeItemKey: (index, post) => `${post.publicationId}-${post.postId}-${index}`,
                itemContent: (index, post) => getPostItemContent(index, post, `${ScrollListKey.Profile}:${profileId}`),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
                icon: isProtected ? <ProtectedIcon width={190} height={50} className="text-third" /> : undefined,
                message: isProtected ? (
                    <div className="flex flex-col">
                        <div className="mt-[42px] text-lg text-second">These posts are protected</div>
                        <div className="mt-6 text-base text-second">
                            Only approved followers can see these posts.
                            <br />
                            To request access, click Follow.
                        </div>
                    </div>
                ) : undefined,
            }}
        />
    );
}
