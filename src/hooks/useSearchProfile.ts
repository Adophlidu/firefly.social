import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact, uniqBy } from 'lodash-es';

import { SearchType, Source } from '@/constants/enum.js';
import { composeSearchProfiles, formatSearchProfile, sortSearchProfiles } from '@/helpers/formatSearchProfile.js';
import { toFireflyPlatformId } from '@/helpers/isSameProfile.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { BskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { TwitterSocialMediaProxy } from '@/providers/twitter/SocialMedia.js';
import { searchWalletAddress } from '@/services/searchWalletAddress.js';

const noNextPage = '__no_next_page__';

export function useSearchProfile(searchType: SearchType, searchKeyword: string, source: Source) {
    return useSuspenseInfiniteQuery({
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
                    ? await runInSafeAsync(() => TwitterSocialMediaProxy.searchProfiles(trimmed, twitterIndicator, 7))
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
}
