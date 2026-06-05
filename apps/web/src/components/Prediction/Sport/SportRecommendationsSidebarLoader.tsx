'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { skipToken, useQuery } from '@tanstack/react-query';
import { memo, useMemo } from 'react';

import { DefaultRightSidebarContent } from '@/components/DefaultRightSidebarContent.js';
import { SportRecommendationsSidebar } from '@/components/Prediction/Sport/SportRecommendationsSidebar.js';
import { SportRecommendationsSkeleton } from '@/components/Prediction/Sport/SportRecommendationsSkeleton.js';
import { STALE_TIMES } from '@/constants/query.js';
import { formatPolymarketSportsEventForUI } from '@/helpers/prediction/category/formatPolymarketSportsEventForUI.js';
import { getEventDetail } from '@/providers/firefly/prediction/getEventDetail.js';
import { getSportRecommendationsResult } from '@/providers/firefly/prediction/getSportRecommendations.js';

interface SportRecommendationsSidebarLoaderProps {
    id: string;
}

export const SportRecommendationsSidebarLoader = memo(function SportRecommendationsSidebarLoader({
    id,
}: SportRecommendationsSidebarLoaderProps) {
    // fetch event detail to get sport data (league, gameId, tags)
    const { data: detail, isLoading: detailLoading } = useQuery({
        queryKey: ['prediction', 'sidebar-event-detail', id],
        staleTime: STALE_TIMES.MINUTE_5,
        queryFn: () => getEventDetail(PredictionPlatform.Polymarket, { id, isMutil: false }),
    });

    const sportData = detail?.sportData;
    const leagueSlug = sportData?.leagueSlug;

    const sportTagSlugs = useMemo(() => {
        if (!detail?.tags) return undefined;
        return detail.tags
            .filter((tag) => {
                const slug = tag.slug?.toLowerCase();
                return slug && !['sports', 'games'].includes(slug);
            })
            .map((tag) => tag.slug!.toLowerCase());
    }, [detail?.tags]);

    // fetch recommendations based on sport data
    const { data: result, isLoading: recommendationsLoading } = useQuery({
        queryKey: ['prediction', 'sidebar-recommendations', id, leagueSlug],
        enabled: !!sportData?.gameId,
        staleTime: STALE_TIMES.MINUTE_5,
        queryFn: sportData?.gameId
            ? () => getSportRecommendationsResult(leagueSlug, sportData.gameId, sportTagSlugs)
            : skipToken,
    });

    const recommendations = useMemo(
        () => (result?.events || []).filter((event) => !!formatPolymarketSportsEventForUI(event)).slice(0, 5),
        [result?.events],
    );

    const isLoading = detailLoading || recommendationsLoading;

    if (!isLoading && (!sportData || !recommendations.length)) return <DefaultRightSidebarContent />;
    if (isLoading) return <SportRecommendationsSkeleton />;

    return (
        <SportRecommendationsSidebar
            categorySlug={result?.categorySlug || leagueSlug || 'live'}
            categoryTagType={result?.categoryTagType}
            events={recommendations}
        />
    );
});
