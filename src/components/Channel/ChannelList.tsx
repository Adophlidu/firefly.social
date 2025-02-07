import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { ChannelInList } from '@/components/ChannelInList.js';
import { ListInPage } from '@/components/ListInPage.js';
import { ScrollListKey, Source, type SocialSource } from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import type { Channel } from '@/providers/types/SocialMedia.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { BSKY_LOGIN_REQUIRED_FEEDS } from '@/constants/index.js';

const getChannelItemContent = (index: number, channel: Channel, listKey: string) => {
    return <ChannelInList key={channel.id} channel={channel} listKey={listKey} index={index} />;
};

interface ChannelListProps {
    source: SocialSource;
    useWindowScroll?: boolean;
}

export function ChannelList({ source, useWindowScroll = true }: ChannelListProps) {
    const currentProfile = useCurrentProfile(source);

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['channels', source, 'trending'],
        queryFn: async ({ pageParam }) => {
            const provider = resolveSocialMediaProvider(source);
            return provider.discoverChannels(createIndicator(undefined, pageParam));
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => {
            const result = data.pages.flatMap((x) => x.data);
            if (source === Source.Bsky && !currentProfile) {
                return result.filter((x) => !BSKY_LOGIN_REQUIRED_FEEDS.includes(x.url));
            }
            return result;
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
