'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { buildPastResultsRequest } from '@/helpers/prediction/polymarket/eventSeriesPills/buildPastResultsParams.js';
import type { SeriesEventForPills } from '@/helpers/prediction/polymarket/eventSeriesPills/types.js';
import { getPolymarketPastResults } from '@/providers/prediction/polymarket/getPolymarketPastResults.js';

export interface UsePolymarketPastResultsOptions {
    enabled?: boolean;
    includeOutcomesBySlug?: boolean;
    outcomesOnly?: boolean;
    pastEventSlugs?: string[];
    count?: number;
}

export function usePolymarketPastResults(
    currentEvent: SeriesEventForPills | undefined,
    seriesEvents: SeriesEventForPills[],
    options: UsePolymarketPastResultsOptions = {},
) {
    const { enabled = true, includeOutcomesBySlug = false, outcomesOnly = false, pastEventSlugs = [], count } = options;

    const request = useMemo(() => {
        if (!currentEvent) return null;
        return buildPastResultsRequest(currentEvent, seriesEvents, {
            includeOutcomesBySlug,
            outcomesOnly,
            pastEventSlugs,
            count,
        });
    }, [count, currentEvent, includeOutcomesBySlug, outcomesOnly, pastEventSlugs, seriesEvents]);

    const canFetch =
        enabled &&
        !!request &&
        (!!request.symbolParams || request.outcomesOnly) &&
        (request.outcomesOnly ? request.pastEventSlugs.length > 0 : true);

    return useQuery({
        queryKey: [
            'polymarket',
            'past-results',
            request?.outcomesOnly ? 'outcomes-by-slug' : 'symbol',
            request?.pastEventSlugs,
            request?.symbolParams?.symbol,
            request?.symbolParams?.variant,
            request?.symbolParams?.count,
            request?.symbolParams?.currentEventStartTime,
            request?.includeOutcomesBySlug,
            request?.outcomesOnly,
        ],
        queryFn: () => getPolymarketPastResults(request!),
        enabled: canFetch,
        staleTime: Number.POSITIVE_INFINITY,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}
