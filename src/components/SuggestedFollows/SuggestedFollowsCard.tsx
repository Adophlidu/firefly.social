'use client';
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/effect-coverflow';

import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Autoplay, EffectCoverflow } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { AsideTitle } from '@/components/AsideTitle.js';
import { Link } from '@/components/Link.js';
import { ProfileSlide } from '@/components/SuggestedFollows/ProfileSlide.js';
import { ExploreType, Source } from '@/constants/enum.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { isSocialDiscoverSource } from '@/helpers/isSource.js';
import { mergeLists } from '@/helpers/mergeLists.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useIsLarge } from '@/hooks/useMediaQuery.js';
import { getSuggestedFollowsInCard } from '@/services/getSuggestedFollows.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import { useBskyStateStore } from '@/store/useProfileStore.js';

export function SuggestedFollowsCard() {
    const isLarge = useIsLarge('min');
    const currentSource = useGlobalState.use.currentSource();
    const profileAll = useCurrentProfilesAll();
    const asyncStatusAll = useAsyncStatusAll();
    const bskySession = useBskyStateStore.use.currentProfileSession();

    const { data: suggestedFollows, isLoading } = useQuery({
        queryKey: [
            'suggested-follows-lite',
            ...SORTED_SOCIAL_SOURCES.map((x) => profileAll[x]?.profileId),
            asyncStatusAll,
            bskySession,
        ],
        staleTime: 1000 * 60 * 2,
        queryFn: async () => {
            const [farcasterData, lensData, bskyData] = await Promise.all([
                runInSafeAsync(() => getSuggestedFollowsInCard(Source.Farcaster)),
                runInSafeAsync(() => getSuggestedFollowsInCard(Source.Lens)),
                runInSafeAsync(() => getSuggestedFollowsInCard(Source.Bsky)),
            ]);
            return mergeLists(farcasterData ?? [], lensData ?? [], bskyData ?? []);
        },
    });

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

    if (isLoading) {
        return (
            <div className="flex h-[252px] w-full shrink-0 animate-pulse flex-col gap-4">
                <div className="mx-3 h-7 bg-bg" />
                <div className="w-full flex-1 rounded-xl bg-bg" />
            </div>
        );
    }

    if (!suggestedFollows?.length || !isLarge) return null;

    return (
        <section>
            <AsideTitle className="flex items-center justify-between">
                <span className="text-xl">
                    <Trans>You might like</Trans>
                </span>
                <Link href={showMoreUrl} className="text-[15px] text-highlight">
                    <Trans>More</Trans>
                </Link>
            </AsideTitle>
            <div className="rounded-xl bg-bg">
                <Swiper
                    initialSlide={suggestedFollows.length > 2 ? 1 : 0}
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
                    {suggestedFollows.map((profile, key) => (
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
