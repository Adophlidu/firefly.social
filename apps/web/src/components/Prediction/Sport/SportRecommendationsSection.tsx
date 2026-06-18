'use client';

import { useQuery } from '@tanstack/react-query';
import { memo, useMemo } from 'react';

import { SportRecommendationsSidebar } from '@/components/Prediction/Sport/SportRecommendationsSidebar.js';
import { STALE_TIMES } from '@/constants/query.js';
import { formatPolymarketSportsEventForUI } from '@/helpers/prediction/category/formatPolymarketSportsEventForUI.js';
import { getSportRecommendations } from '@/providers/firefly/prediction/getSportRecommendations.js';

interface SportRecommendationsSectionProps {
    leagueSlug?: string;
    excludeGameId?: number;
}

export const SportRecommendationsSection = memo(function SportRecommendationsSection({
    leagueSlug,
    excludeGameId,
}: SportRecommendationsSectionProps) {
    const { data: rawEvents } = useQuery({
        queryKey: ['sport', 'recommendations', leagueSlug, excludeGameId],
        enabled: !!leagueSlug,
        staleTime: STALE_TIMES.MINUTE_5,
        queryFn: async () => getSportRecommendations(leagueSlug!, excludeGameId),
    });

    const events = useMemo(
        () => rawEvents?.filter((event) => !!formatPolymarketSportsEventForUI(event)).slice(0, 5) || [],
        [rawEvents],
    );

    if (!events.length || !leagueSlug) return null;

    return (
        <div className="p-4">
            <SportRecommendationsSidebar categorySlug={leagueSlug} events={events} />
        </div>
    );
});
