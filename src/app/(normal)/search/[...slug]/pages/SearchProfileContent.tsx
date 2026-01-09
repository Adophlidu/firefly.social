'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact, uniqBy } from 'lodash-es';

import { ListInPage } from '@/components/ListInPage.js';
import { Empty } from '@/components/Search/Empty.js';
import { SearchableProfileItem } from '@/components/Search/SearchableProfileItem.js';
import { ScrollListKey } from '@/constants/enum.js';
import { composeSearchProfiles, formatSearchProfile, sortSearchProfiles } from '@/helpers/formatSearchProfile.js';
import { toFireflyPlatformId } from '@/helpers/isSameProfile.js';
import { createIndicator } from '@/helpers/pageable.js';
import { bskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import { searchIdentity } from '@/providers/firefly/endpoint/searchIdentity.js';
import { twitterSocialMediaProxy } from '@/providers/twitter/SocialMedia.js';
import { type Profile as FireflyProfile } from '@/providers/types/Firefly.js';
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

function formatTwitterSearchKeyword(input: string) {
    if (!input?.trim()) return;

    return input
        .replace(/[^A-Za-z0-9_'\s]/g, '')
        .trim()
        .replace(/\s+/g, ' ');
}

const noNextPage = '__no_next_page__';

export function SearchProfileContent() {
    const { searchKeyword, searchType, source } = useSearchStateStore();

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['search', searchType, searchKeyword, source],
        queryFn: async ({ pageParam, signal }) => {
            if (!searchKeyword) return;

            const fireflyIndicator = pageParam.firefly ? createIndicator(undefined, pageParam.firefly) : undefined;
            const twitterIndicator = pageParam.twitter ? createIndicator(undefined, pageParam.twitter) : undefined;
            const bskyIndicator = pageParam.bsky ? createIndicator(undefined, pageParam.bsky) : undefined;
            const trimmed = formatTwitterSearchKeyword(searchKeyword);

            const [fireflyRes, xRes, bskyRes] = await Promise.allSettled([
                pageParam.firefly !== noNextPage
                    ? searchIdentity(searchKeyword, {
                          signal,
                          size: 10,
                          indicator: fireflyIndicator,
                      })
                    : undefined,
                pageParam.twitter !== noNextPage && trimmed
                    ? twitterSocialMediaProxy.searchProfiles(trimmed, twitterIndicator, 7)
                    : undefined,
                pageParam.bsky !== noNextPage
                    ? bskySocialMediaProvider.searchProfiles(searchKeyword, bskyIndicator, 3)
                    : undefined,
            ]);
            const data = fireflyRes.status === 'fulfilled' ? fireflyRes.value : undefined;
            const twitterProfiles = xRes.status === 'fulfilled' ? xRes.value : undefined;
            const bskyProfiles = bskyRes.status === 'fulfilled' ? bskyRes.value : undefined;

            const socialProfiles = sortSearchProfiles(
                composeSearchProfiles(
                    compact(data?.data.map((x) => formatSearchProfile(x, searchKeyword))),
                    twitterProfiles?.data || [],
                    bskyProfiles?.data || [],
                ),
                searchKeyword,
            );

            const isFirstPage = !pageParam.firefly && !pageParam.twitter && !pageParam.bsky;
            const walletProfile =
                !socialProfiles.length && isFirstPage ? await searchWalletAddress(searchKeyword) : undefined;

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
