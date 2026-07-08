'use client';

import 'swiper/css';

import { SORTED_SOCIAL_SOURCES } from '@dimensiondev/constants/computed';
import { ExploreType, Source } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import { useMemo } from 'react';
import { Autoplay, EffectCoverflow } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { queryMutedProfiles } from '@/batches/queryMutedProfiles.js';
import { AsideTitle } from '@/components/AsideTitle.js';
import { Link } from '@/components/Link.js';
import { ProfileSlide } from '@/components/SuggestedFollows/ProfileSlide.js';
import { SuggestedFollowsSkeleton } from '@/components/SuggestedFollows/SuggestedFollowsSkeleton.js';
import { IS_FIREFOX } from '@/constants/browser.js';
import { STALE_TIMES } from '@/constants/query.js';
import { isSocialDiscoverSource } from '@/helpers/isSource.js';
import { mergeLists } from '@/helpers/mergeLists.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useIsLarge } from '@/hooks/useMediaQuery.js';
import { useRefetchWhenReady } from '@/hooks/useRefetchWhenReady.js';
import { getSuggestedFollowsInCard } from '@/services/getSuggestedFollows.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import { useBskyProfileStore } from '@/store/useProfileStore/useBskyProfileStore.js';

export function SuggestedFollowsCard() {
    const isLarge = useIsLarge('min');
    const currentSource = useGlobalState.use.currentSource();
    const profileAll = useCurrentProfilesAll();
    // The viewer's sessions resume asynchronously after first paint and can flip between
    // pending/settled a few times; it must not sit in a query key (see useRefetchWhenReady).
    const asyncStatusAll = useAsyncStatusAll();
    const bskySession = useBskyProfileStore.use.currentProfileSession();

    const {
        data: suggestedFollows,
        isLoading,
        isError,
        refetch: refetchSuggestedFollows,
    } = useQuery({
        queryKey: [
            'suggested-follows-lite',
            ...SORTED_SOCIAL_SOURCES.map((x) => profileAll[x]?.profileId),
            bskySession,
        ],
        staleTime: STALE_TIMES.MINUTE_30,
        queryFn: async () => {
            const suggestedProfiles = await Promise.allSettled(
                SORTED_SOCIAL_SOURCES.map((source) =>
                    runInSafeAsync(() =>
                        getSuggestedFollowsInCard(source, { viewerId: profileAll[source]?.profileId }),
                    ),
                ),
            );
            const results = mergeLists(
                ...compact(suggestedProfiles.map((x) => (x.status === 'fulfilled' ? x.value : []))),
            );

            await runInSafeAsync(() => queryMutedProfiles(results.map((x) => ({ source: x.source, id: x.profileId }))));
            return results;
        },
    });

    // Sessions may still be restoring on first fetch, so this can start out generic; refetch
    // once they settle to swap in the personalized suggestions without flashing a loading state.
    useRefetchWhenReady(!asyncStatusAll, refetchSuggestedFollows);

    const suggestedFollowsKey = suggestedFollows?.map((profile) => `${profile.source}:${profile.profileId}`).join(',');

    const { data: profilesWithStats } = useQuery({
        queryKey: ['profile-stats', suggestedFollowsKey],
        enabled: !!suggestedFollows?.length && !isLoading,
        staleTime: STALE_TIMES.MINUTE_30,

        queryFn: async () => {
            if (!suggestedFollows?.length) return [];

            const farAndBskyProfiles = suggestedFollows.filter((x) =>
                [Source.Bsky, Source.Farcaster].includes(x.source),
            );
            if (!farAndBskyProfiles.length) return [];

            const profiles = await Promise.allSettled(
                ([Source.Farcaster, Source.Bsky] as const).map(async (x) => {
                    const profileIds = farAndBskyProfiles
                        .filter((profile) => profile.source === x)
                        .map((profile) => profile.profileId);
                    if (!profileIds.length) return [];

                    return resolveSocialMediaProvider(x).getProfilesByIds(profileIds);
                }),
            );
            return profiles.flatMap((x) => (x.status === 'fulfilled' ? x.value : []));
        },
    });

    const suggestedFollowsWithStats = useMemo(() => {
        if (!suggestedFollows?.length || !profilesWithStats?.length) return suggestedFollows;

        return suggestedFollows.map((profile) => {
            if (![Source.Farcaster, Source.Bsky].includes(profile.source)) return profile;
            const profileWithStats = profilesWithStats.find(
                (p) => p.profileId === profile.profileId && p.source === profile.source,
            );
            if (!profileWithStats) return profile;

            return {
                ...profile,
                followerCount: profileWithStats.followerCount,
                followingCount: profileWithStats.followingCount,
            };
        });
    }, [suggestedFollows, profilesWithStats]);

    const showMoreUrl = useMemo(() => {
        const isOnlyFarcaster = !!profileAll.Farcaster && !profileAll.Lens && !profileAll.Bsky;
        const isOnlyLens = !profileAll.Farcaster && !!profileAll.Lens && !profileAll.Bsky;
        const isOnlyBsky = !!profileAll.Bsky && !profileAll.Farcaster && !profileAll.Lens;
        if (isOnlyFarcaster) {
            return resolveExploreUrl(ExploreType.TopProfiles, Source.Farcaster);
        }
        if (isOnlyLens) {
            return resolveExploreUrl(ExploreType.TopProfiles, Source.Lens);
        }
        if (isOnlyBsky) {
            return resolveExploreUrl(ExploreType.TopProfiles, Source.Bsky);
        }
        return resolveExploreUrl(
            ExploreType.TopProfiles,
            isSocialDiscoverSource(currentSource) ? currentSource : Source.Farcaster,
        );
    }, [currentSource, profileAll.Farcaster, profileAll.Lens, profileAll.Bsky]);

    if (isError) return null;
    if (isLoading) return <SuggestedFollowsSkeleton />;
    if (!suggestedFollowsWithStats?.length || !isLarge) return null;

    const swiperEffect = IS_FIREFOX ? 'slide' : 'coverflow';
    const swiperClassName = IS_FIREFOX ? 'ff-suggested-follows-swiper--firefox' : undefined;
    const swiperSpaceBetween = IS_FIREFOX ? 12 : 0;

    return (
        <section>
            <AsideTitle
                caption={<Trans>You might like</Trans>}
                more={
                    <Link href={showMoreUrl} prefetch={false} className="text-medium text-highlight">
                        <Trans>More</Trans>
                    </Link>
                }
            />
            <div className="rounded-xl bg-bg">
                <Swiper
                    className={swiperClassName}
                    initialSlide={suggestedFollowsWithStats.length > 2 ? 1 : 0}
                    effect={swiperEffect}
                    grabCursor
                    centeredSlides
                    slidesPerView={'auto'}
                    coverflowEffect={{
                        rotate: 50,
                        stretch: 0,
                        depth: 100,
                        modifier: 1,
                        slideShadows: false,
                    }}
                    pagination
                    loop
                    spaceBetween={swiperSpaceBetween}
                    updateOnWindowResize={false}
                    resizeObserver={false}
                    wrapperClass="!box-border"
                    autoplay={{ delay: 5000, pauseOnMouseEnter: true, disableOnInteraction: false }}
                    modules={IS_FIREFOX ? [Autoplay] : [Autoplay, EffectCoverflow]}
                >
                    {suggestedFollowsWithStats.map((profile, key) => (
                        <SwiperSlide className="!h-[208px] !w-[164px]" key={key}>
                            <div className="py-3">
                                <ProfileSlide profile={profile} />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </section>
    );
}
