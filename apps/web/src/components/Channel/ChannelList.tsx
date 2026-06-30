import type { SocialSource } from '@dimensiondev/enums';
import { ScrollListKey } from '@dimensiondev/enums';
import { createIndicator } from '@dimensiondev/utils';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { ChannelInList } from '@/components/ChannelInList.js';
import { ListInPage } from '@/components/ListInPage.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

// Number of items react-virtuoso renders/measures on the initial (server) render.
const SSR_INITIAL_ITEM_COUNT = 10;

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

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['channels', source, 'trending', currentProfile?.profileId],
        queryFn: async ({ pageParam }) => {
            const provider = resolveSocialMediaProvider(source);
            return provider.discoverChannels(createIndicator(undefined, pageParam));
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => {
            return data.pages.flatMap((x) => x.data);
        },
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
                initialItemCount: Math.min(queryResult.data.length, SSR_INITIAL_ITEM_COUNT),
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
