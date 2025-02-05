'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact, uniqBy } from 'lodash-es';

import { ListInPage } from '@/components/ListInPage.js';
import { Empty } from '@/components/Search/Empty.js';
import { SearchableProfileItem } from '@/components/Search/SearchableProfileItem.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { composeSearchProfiles, formatSearchProfile } from '@/helpers/formatSearchProfile.js';
import { toFireflyPlatformId } from '@/helpers/isSameProfile.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { BskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { TwitterSocialMediaProvider } from '@/providers/twitter/SocialMedia.js';
import type { Profile as FireflyProfile } from '@/providers/types/Firefly.js';
import { searchWalletAddress } from '@/services/searchWalletAddress.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';

const getSearchItemContent = ({ profile, related }: { profile: FireflyProfile; related: FireflyProfile[] }) => {
    return <SearchableProfileItem profile={profile} related={related} key={toFireflyPlatformId(profile)} />;
};

const noNextPage = '__no_next_page__';

export function SearchProfileContent() {
    const isTwitterLogin = useIsLogin(Source.Twitter);
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
                          size: 25,
                          indicator: fireflyIndicator,
                      })
                    : createPageable([], createIndicator());

            const trimmed = searchKeyword.trim().replace(/^@/, '');
            const twitterProfiles =
                isTwitterLogin && pageParam.twitter !== noNextPage && trimmed
                    ? await runInSafeAsync(() => TwitterSocialMediaProvider.searchProfiles(trimmed, twitterIndicator))
                    : undefined;

            const bskyProfiles =
                pageParam.bsky !== noNextPage
                    ? await runInSafeAsync(() => BskySocialMediaProvider.searchProfiles(searchKeyword, bskyIndicator))
                    : undefined;

            const socialProfiles = composeSearchProfiles(
                compact(data.data.map(formatSearchProfile)),
                twitterProfiles?.data || [],
                bskyProfiles?.data || [],
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
            return {
                firefly: lastPage?.nextIndicator?.id || noNextPage,
                twitter: lastPage?.twitterNextIndicator?.id || noNextPage,
                bsky: lastPage?.bskyNextIndicator?.id || noNextPage,
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
