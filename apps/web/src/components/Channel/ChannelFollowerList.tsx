import { EMPTY_LIST } from '@dimensiondev/constants';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { ListInPage } from '@/components/ListInPage.js';
import { ProfileInList } from '@/components/ProfileInList.js';
import { ScrollListKey, type SocialSource } from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface ChannelFollowerListProps {
    channelId: string;
    source: SocialSource;
}

function getFollowerInList(index: number, profile: Profile, listKey?: string) {
    return <ProfileInList profile={profile} key={`${profile.profileId}-${index}`} listKey={listKey} index={index} />;
}

export function ChannelFollowerList({ channelId, source }: ChannelFollowerListProps) {
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['profiles', source, 'followers-of', channelId],
        queryFn: async ({ pageParam }) => {
            const provider = resolveSocialMediaProvider(source);
            return provider.getChannelFollowers(channelId, createIndicator(undefined, pageParam));
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => data.pages.flatMap((page) => page?.data ?? EMPTY_LIST),
    });

    return (
        <ListInPage
            source={source}
            key={source}
            queryResult={queryResult}
            VirtualListProps={{
                key: `${ScrollListKey.ChannelFollowers}:${source}:${channelId}`,
                computeItemKey: (index, item: Profile) => `${item.profileId}-${index}`,
                itemContent: (index, item: Profile) => getFollowerInList(index, item),
            }}
            NoResultsFallbackProps={{
                className: 'md:pt-[228px] max-md:py-20',
            }}
        />
    );
}
