'use client';

import { useQuery } from '@tanstack/react-query';

import { STALE_TIMES } from '@/constants/query.js';
import {
    getPolymarketSeriesEventsOpen,
    getPolymarketSeriesEventsPast,
} from '@/providers/prediction/polymarket/getSeriesEventsForPills.js';

export function usePolymarketSeriesEventsOpen(seriesId: string | undefined, seriesSlug?: string) {
    return useQuery({
        queryKey: ['polymarket', 'series-events', 'open', seriesId, seriesSlug],
        queryFn: () => getPolymarketSeriesEventsOpen(seriesId!, seriesSlug),
        enabled: !!seriesId,
        staleTime: STALE_TIMES.MINUTE_5,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
    });
}

export function usePolymarketSeriesEventsPast(seriesId: string | undefined, seriesSlug?: string) {
    return useQuery({
        queryKey: ['polymarket', 'series-events', 'past', seriesId, seriesSlug],
        queryFn: () => getPolymarketSeriesEventsPast(seriesId!, seriesSlug),
        enabled: !!seriesId,
        staleTime: STALE_TIMES.MINUTE_5,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
    });
}
