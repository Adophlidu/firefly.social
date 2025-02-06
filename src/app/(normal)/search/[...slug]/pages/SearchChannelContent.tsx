'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact, uniqBy } from 'lodash-es';

import { ChannelInList } from '@/components/ChannelInList.js';
import { ListInPage } from '@/components/ListInPage.js';
import { Empty } from '@/components/Search/Empty.js';
import { SearchSources } from '@/components/Search/SearchSources.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { createIndicator } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import type { Channel } from '@/providers/types/SocialMedia.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';

const getSearchItemContent = (channel: Channel, index: number, listKey: string) => {
    return <ChannelInList key={channel.id} channel={channel} listKey={listKey} index={index} />;
};

export function SearchChannelContent() {
    const { searchKeyword, searchType, source } = useSearchStateStore();
    const currentSocialSource = narrowToSocialSource(source);

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['search', searchType, searchKeyword, source],
        queryFn: async ({ pageParam }) => {
            if (!searchKeyword) return;
            const provider = resolveSocialMediaProvider(currentSocialSource);
            const indicator = pageParam ? createIndicator(undefined, pageParam) : undefined;

            const channels = await provider.searchChannels(searchKeyword.replace(/^\//, ''), indicator);
            if (!indicator?.id && currentSocialSource === Source.Lens) {
                channels.data.reverse();
            }

            return channels;
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return;
            return lastPage?.nextIndicator?.id;
        },
        select(data) {
            return uniqBy(
                compact(data.pages.flatMap((x) => x?.data ?? [])),
                (channel) => `${channel.source}:${channel.id}`,
            );
        },
    });

    const listKey = `${ScrollListKey.Search}:${searchType}:${searchKeyword}:${source}`;

    return (
        <>
            <SearchSources source={source} query={searchKeyword} searchType={searchType} />
            <ListInPage
                source={source}
                key={listKey}
                queryResult={queryResult}
                VirtualListProps={{
                    listKey,
                    computeItemKey: (index, channel) => `${channel.id}_${index}`,
                    itemContent: (index, channel) => getSearchItemContent(channel, index, listKey),
                }}
                NoResultsFallbackProps={{
                    message: <Empty keyword={searchKeyword} />,
                }}
            />
        </>
    );
}
