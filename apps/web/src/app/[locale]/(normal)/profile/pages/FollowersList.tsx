'use client';

import { EMPTY_LIST } from '@dimensiondev/constants';
import { createIndicator, type Pageable, type PageIndicator } from '@dimensiondev/utils';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { getFollowInList } from '@/components/FollowInList.js';
import { ListInPage } from '@/components/ListInPage.js';
import { ScrollListKey, type SocialSource } from '@/constants/enum.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function FollowersList({ profileId, source }: { profileId: string; source: SocialSource }) {
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['profiles', source, 'followers', profileId],
        async queryFn({ pageParam, signal }) {
            const provider = resolveSocialMediaProvider(source);
            return provider.getFollowers(profileId, createIndicator(undefined, pageParam), signal);
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => (lastPage as Pageable<Profile, PageIndicator>)?.nextIndicator?.id,
        select: (data) => data.pages.flatMap((page) => page?.data ?? EMPTY_LIST),
    });

    return (
        <ListInPage
            source={source}
            key={source}
            queryResult={queryResult}
            VirtualListProps={{
                key: `${ScrollListKey.Followers}:${source}:${profileId}`,
                computeItemKey: (index, item: Profile) => `${item.profileId}-${index}`,
                itemContent: (index, item: Profile) => getFollowInList(index, item),
            }}
            NoResultsFallbackProps={{
                className: 'md:pt-[228px] max-md:py-20',
            }}
        />
    );
}
