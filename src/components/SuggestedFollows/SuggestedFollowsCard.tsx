'use client';

import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/effect-coverflow';

import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import { useMemo } from 'react';
import { Autoplay, EffectCoverflow } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { AsideTitle } from '@/components/AsideTitle.js';
import { Link } from '@/components/Link.js';
import { ProfileSlide } from '@/components/SuggestedFollows/ProfileSlide.js';
import { SuggestedFollowsSkeleton } from '@/components/SuggestedFollows/SuggestedFollowsSkeleton.js';
import { ExploreType, type SocialSource, Source } from '@/constants/enum.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { isSocialDiscoverSource } from '@/helpers/isSource.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';
import { mergeLists } from '@/helpers/mergeLists.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useIsLarge } from '@/hooks/useMediaQuery.js';
import { getSuggestedFollowsInCard } from '@/services/getSuggestedFollows.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import { useBskyProfileStore } from '@/store/useProfileStore/useBskyProfileStore.js';

const getSuggestedFollowersCached = memoizePromise(
    async (source: SocialSource, profileId?: string) => {
        return getSuggestedFollowsInCard(source);
    },
    (source, profileId) => `${source}-${profileId}`,
);

export function SuggestedFollowsCard() {
    const isLarge = useIsLarge('min');
    const currentSource = useGlobalState.use.currentSource();
    const profileAll = useCurrentProfilesAll();
    const asyncStatusAll = useAsyncStatusAll();
    const bskySession = useBskyProfileStore.use.currentProfileSession();

    const commonKeys = [...SORTED_SOCIAL_SOURCES.map((x) => profileAll[x]?.profileId), asyncStatusAll, bskySession];
    const { data: suggestedFollows, isLoading } = useQuery({
        queryKey: [
            'suggested-follows-lite',
            ...SORTED_SOCIAL_SOURCES.map((x) => profileAll[x]?.profileId),
            asyncStatusAll,
            bskySession,
        ],
        staleTime: 1000 * 60 * 30, // 30 minutes
        enabled: !asyncStatusAll,
        queryFn: async () => {
            const suggestedProfiles = await Promise.allSettled(
                SORTED_SOCIAL_SOURCES.map((source) =>
                    runInSafeAsync(() => getSuggestedFollowersCached(source, profileAll[source]?.profileId)),
                ),
            );
            return mergeLists(...compact(suggestedProfiles.map((x) => (x.status === 'fulfilled' ? x.value : []))));
        },
    });

    const { data: profilesWithStats } = useQuery({
        queryKey: ['profile-stats', ...commonKeys],
        enabled: !!suggestedFollows?.length && !isLoading,
        staleTime: 1000 * 60 * 30, // 30 minutes
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

    if (isLoading) return <SuggestedFollowsSkeleton />;
    if (!suggestedFollowsWithStats?.length || !isLarge) return null;

    return (
        <section>
            <AsideTitle
                caption={
                    <span className="text-xl">
                        <Trans>You might like</Trans>
                    </span>
                }
                more={
                    <Link href={showMoreUrl} className="text-[15px] text-highlight">
                        <Trans>More</Trans>
                    </Link>
                }
            />
            <div className="rounded-xl bg-bg">
                <Swiper
                    initialSlide={suggestedFollowsWithStats.length > 2 ? 1 : 0}
                    effect={'coverflow'}
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
                    updateOnWindowResize={false}
                    resizeObserver={false}
                    wrapperClass="!box-border"
                    autoplay={{ delay: 5000 }}
                    modules={[Autoplay, EffectCoverflow]}
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
