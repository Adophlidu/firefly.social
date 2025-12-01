'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact, uniqBy } from 'lodash-es';

import { ChannelInList } from '@/components/ChannelInList.js';
import { ListInPage } from '@/components/ListInPage.js';
import { Empty } from '@/components/Search/Empty.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { REQUIRE_LOGIN_SOURCES_IN_SEARCH } from '@/constants/index.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import type { Channel } from '@/providers/types/SocialMedia.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';

const getSearchItemContent = (channel: Channel, index: number, listKey: string) => {
    return (
        <ChannelInList
            showSourceAvatarWhenNoAvatar
            key={channel.id}
            channel={channel}
            listKey={listKey}
            index={index}
        />
    );
};

export function SearchChannelContent() {
    const { searchKeyword, searchType, source } = useSearchStateStore();
    const currentSocialSource = narrowToSocialSource(source);
    const isLogin = useIsLogin(currentSocialSource);
    const loginRequired = REQUIRE_LOGIN_SOURCES_IN_SEARCH.includes(currentSocialSource);

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['search', searchType, searchKeyword, source, isLogin],
        queryFn: async ({ pageParam }) => {
            try {
                if (!searchKeyword || (loginRequired && !isLogin)) return;
                const indicator = pageParam ? createIndicator(undefined, pageParam) : undefined;

                const provider = resolveSocialMediaProvider(currentSocialSource);
                const channels = await provider.searchChannels(searchKeyword.replace(/^\//, ''), indicator);
                if (!indicator?.id && currentSocialSource === Source.Lens) {
                    channels.data.reverse();
                }

                return channels;
            } catch {
                return createPageable([], createIndicator(undefined, pageParam));
            }
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
            <ListInPage
                loginRequired={loginRequired}
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
