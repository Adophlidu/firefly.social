'use client';

import { Source } from '@dimensiondev/enums';
import { createIndicator } from '@dimensiondev/utils';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact, uniqBy } from 'lodash-es';

import { ListInPage } from '@/components/ListInPage.js';
import { Empty } from '@/components/Search/Empty.js';
import { SearchableProfileItem } from '@/components/Search/SearchableProfileItem.js';
import { FireflyPlatform, ScrollListKey, type SocialSource } from '@/constants/enum.js';
import { toFireflyPlatformId } from '@/helpers/isSameProfile.js';
import { resolveFireflyPlatform } from '@/helpers/resolveFireflyPlatform.js';
import { resolveSearchUrlType, SearchUrlKind } from '@/helpers/resolveSearchUrlType.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { logger } from '@/libs/Logger.js';
import type { Profile as FireflyProfile } from '@/providers/types/Firefly.js';
import { searchProfilesByKeyword } from '@/services/searchProfilesByKeyword.js';
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
        queryFn: async ({ pageParam, signal }) => {
            if (!searchKeyword) return;

            const fireflyIndicator = pageParam.firefly ? createIndicator(undefined, pageParam.firefly) : undefined;
            const twitterIndicator = pageParam.twitter ? createIndicator(undefined, pageParam.twitter) : undefined;
            const bskyIndicator = pageParam.bsky ? createIndicator(undefined, pageParam.bsky) : undefined;
            const lensIndicator = pageParam.lens ? createIndicator(undefined, pageParam.lens) : undefined;

            // Check if searchKeyword is a profile URL and extract identifier if it matches
            const urlResult = resolveSearchUrlType(searchKeyword);
            const isProfileUrl = urlResult?.kind === SearchUrlKind.Profile && urlResult.source && urlResult.identifier;

            // Use identifier if URL matches, otherwise use full searchKeyword
            const keyword = isProfileUrl && urlResult.identifier ? urlResult.identifier : searchKeyword;

            const {
                profiles: socialProfiles,
                fireflyData,
                twitterProfiles,
                bskyProfiles,
                lensProfiles,
            } = await searchProfilesByKeyword({
                keyword,
                signal,
                identitySize: 10,
                twitterSize: 7,
                bskySize: 3,
                indicators: {
                    firefly: fireflyIndicator,
                    twitter: twitterIndicator,
                    bsky: bskyIndicator,
                    lens: lensIndicator,
                },
                skip: {
                    firefly: pageParam.firefly === noNextPage,
                    twitter: pageParam.twitter === noNextPage,
                    bsky: pageParam.bsky === noNextPage,
                    lens: pageParam.lens === noNextPage,
                },
            });

            const isFirstPage = !pageParam.firefly && !pageParam.twitter && !pageParam.bsky && !pageParam.lens;
            const walletProfile =
                !socialProfiles.length && isFirstPage ? await searchWalletAddress(keyword) : undefined;

            // Prepend pinned profile on first page
            let pinnedProfile: { profile: FireflyProfile; related: FireflyProfile[] } | undefined;
            if (isFirstPage && isProfileUrl && urlResult.identifier) {
                try {
                    const provider = resolveSocialMediaProvider(urlResult.source as SocialSource);
                    const profile = await provider.getProfileByHandle(urlResult.identifier);
                    const platform =
                        profile.source === Source.Bsky ? FireflyPlatform.Bsky : resolveFireflyPlatform(profile.source);
                    const mapped = {
                        platform,
                        platform_id: profile.profileId,
                        handle: profile.handle,
                        name: profile.displayName,
                        hit: true,
                        score: 0,
                        avatar: profile.pfp,
                    } as FireflyProfile;
                    pinnedProfile = { profile: mapped, related: [mapped] };
                } catch (error) {
                    logger.error('[Search] Failed to fetch pinned profile', error);
                    throw error;
                }
            }

            const data = socialProfiles.length
                ? socialProfiles
                : walletProfile
                  ? [{ profile: walletProfile, related: [walletProfile] }]
                  : [];

            return {
                ...fireflyData,
                twitterNextIndicator: twitterProfiles?.nextIndicator,
                bskyNextIndicator: bskyProfiles?.nextIndicator,
                lensNextIndicator: lensProfiles?.nextIndicator,
                data: pinnedProfile ? [pinnedProfile, ...data] : data,
            };
        },
        initialPageParam: { firefly: '', twitter: '', bsky: '', lens: '' },
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return;

            const { nextIndicator, twitterNextIndicator, bskyNextIndicator, lensNextIndicator } = lastPage || {};
            if (!nextIndicator && !twitterNextIndicator && !bskyNextIndicator && !lensNextIndicator) return;

            return {
                firefly: nextIndicator?.id || noNextPage,
                twitter: twitterNextIndicator?.id || noNextPage,
                bsky: bskyNextIndicator?.id || noNextPage,
                lens: lensNextIndicator?.id || noNextPage,
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
