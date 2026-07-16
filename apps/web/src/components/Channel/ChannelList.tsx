'use client';

import type { SocialSource } from '@dimensiondev/enums';
import { ScrollListKey } from '@dimensiondev/enums';
import { createIndicator } from '@dimensiondev/utils';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { ChannelInList } from '@/components/ChannelInList.js';
import { useExploreChannelsContext } from '@/components/Explores/ExploreChannelsContext.js';
import { ListInPage } from '@/components/ListInPage.js';
import { SSR_LIST_LIMIT } from '@/constants/ssr.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

const getChannelItemContent = (index: number, channel: Channel, listKey: string) => {
    return (
        <ChannelInList key={channel.id} channel={channel} listKey={listKey} index={index} hideFollowersCount={false} />
    );
};

interface ChannelListProps {
    source: SocialSource;
    useWindowScroll?: boolean;
}

export function ChannelList({ source, useWindowScroll = true }: ChannelListProps) {
    const currentProfile = useCurrentProfile(source);
    const { initialChannelsPage } = useExploreChannelsContext();

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['channels', source, 'trending', currentProfile?.profileId],
        queryFn: async ({ pageParam }) => {
            const provider = resolveSocialMediaProvider(source);
            return provider.discoverChannels(createIndicator(undefined, pageParam), currentProfile?.profileId);
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => {
            return data.pages.flatMap((x) => x.data);
        },
        initialData: currentProfile?.profileId ? undefined : initialChannelsPage,
        // The SSR page is sliced to SSR_LIST_LIMIT items but keeps the full page's cursor, so
        // paginating from it would skip the rest of page one. Marking it stale triggers a
        // background refetch that restores the complete first page.
        initialDataUpdatedAt: 0,
    });

    return (
        <ListInPage
            source={source}
            key={source}
            queryResult={queryResult}
            className="no-scrollbar"
            VirtualListProps={{
                useWindowScroll,
                listKey: `${ScrollListKey.Channel}:trending`,
                // Render the first screen during SSR; without it react-virtuoso emits an
                // empty list on the server and the prefetched channels never reach the HTML.
                initialItemCount: Math.min(queryResult.data.length, SSR_LIST_LIMIT),
                computeItemKey: (index, channel) => `${channel.id}-${index}`,
                itemContent: (index, channel) =>
                    getChannelItemContent(index, channel, `${ScrollListKey.Channel}:trending`),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
