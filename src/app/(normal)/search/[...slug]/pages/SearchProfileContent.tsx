'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact, uniqBy } from 'lodash-es';

import { ListInPage } from '@/components/ListInPage.js';
import { Empty } from '@/components/Search/Empty.js';
import { SearchableProfileItem } from '@/components/Search/SearchableProfileItem.js';
import { ScrollListKey } from '@/constants/enum.js';
import { composeSearchProfiles, formatSearchProfile, sortSearchProfiles } from '@/helpers/formatSearchProfile.js';
import { toFireflyPlatformId } from '@/helpers/isSameProfile.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { BskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { TwitterSocialMediaProvider } from '@/providers/twitter/SocialMedia.js';
import type { Profile as FireflyProfile } from '@/providers/types/Firefly.js';
import { searchWalletAddress } from '@/services/searchWalletAddress.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';

const getSearchItemContent = ({ profile, related }: { profile: FireflyProfile; related: FireflyProfile[] }) => {
    return (
        <SearchableProfileItem
            profile={profile}
            related={related}
            key={toFireflyPlatformId(profile)}
            autoQueryEnsAvatar
        />
    );
};

const noNextPage = '__no_next_page__';

export function SearchProfileContent() {
    const { searchKeyword, searchType, source } = useSearchStateStore();

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['search', searchType, searchKeyword, source],
        queryFn: async ({ pageParam }) => {
            if (!searchKeyword) return;

            const fireflyIndicator = pageParam.firefly ? createIndicator(undefined, pageParam.firefly) : undefined;
            const twitterIndicator = pageParam.twitter ? createIndicator(undefined, pageParam.twitter) : undefined;
            const bskyIndicator = pageParam.bsky ? createIndicator(undefined, pageParam.bsky) : undefined;

            const data =
                pageParam.firefly !== noNextPage
                    ? await FireflyEndpointProvider.searchIdentity(searchKeyword, {
                          size: 10,
                          indicator: fireflyIndicator,
                      })
                    : createPageable([], createIndicator());

            const trimmed = searchKeyword.trim().replace(/^@/, '');
            const twitterProfiles =
                pageParam.twitter !== noNextPage && trimmed
                    ? await runInSafeAsync(() =>
                          TwitterSocialMediaProvider.searchProfiles(trimmed, twitterIndicator, 7),
                      )
                    : undefined;

            const bskyProfiles =
                pageParam.bsky !== noNextPage
                    ? await runInSafeAsync(() =>
                          BskySocialMediaProvider.searchProfiles(searchKeyword, bskyIndicator, 3),
                      )
                    : undefined;

            const socialProfiles = sortSearchProfiles(
                composeSearchProfiles(
                    compact(data.data.map((x) => formatSearchProfile(x, searchKeyword))),
                    twitterProfiles?.data || [],
                    bskyProfiles?.data || [],
                ),
                searchKeyword,
            );

            const walletProfile = !socialProfiles.length ? await searchWalletAddress(searchKeyword) : undefined;

            return {
                ...data,
                twitterNextIndicator: twitterProfiles?.nextIndicator,
                bskyNextIndicator: bskyProfiles?.nextIndicator,
                data: socialProfiles.length
                    ? socialProfiles
                    : walletProfile
                      ? [
                            {
                                profile: walletProfile,
                                related: [walletProfile],
                            },
                        ]
                      : [],
            };
        },
        initialPageParam: { firefly: '', twitter: '', bsky: '' },
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return;

            const { nextIndicator, twitterNextIndicator, bskyNextIndicator } = lastPage || {};
            if (!nextIndicator && !twitterNextIndicator && !bskyNextIndicator) return;

            return {
                firefly: nextIndicator?.id || noNextPage,
                twitter: twitterNextIndicator?.id || noNextPage,
                bsky: bskyNextIndicator?.id || noNextPage,
            };
        },
        select(data) {
            return uniqBy(compact(data.pages.flatMap((x) => x?.data ?? [])), ({ profile }) =>
                toFireflyPlatformId(profile),
            );
        },
    });

    const listKey = `${ScrollListKey.Search}:${searchType}:${searchKeyword}:${source}`;

    return (
        <ListInPage
            source={source}
            key={listKey}
            queryResult={queryResult}
            VirtualListProps={{
                listKey,
                computeItemKey: (index, item) => `${item.profile.platform_id}_${index}`,
                itemContent: (_, item) => getSearchItemContent(item),
            }}
            NoResultsFallbackProps={{
                message: <Empty keyword={searchKeyword} />,
            }}
        />
    );
}
