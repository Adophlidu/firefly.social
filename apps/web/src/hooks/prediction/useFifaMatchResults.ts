'use client';

import { useQuery } from '@tanstack/react-query';

import { indexFifaMatchResultsBySlug } from '@/helpers/prediction/fifaMatchResults.js';
import { getFifaMatchResults } from '@/providers/firefly/prediction/getFifaMatchResults.js';
import type { FifaMatchResultData } from '@/providers/types/Firefly.js';

/** FIFA feed poll cadence for live matches (faster than the Polymarket cache). */
export const FIFA_LIVE_REFETCH_INTERVAL_MS = 5_000;

interface Options {
    enabled: boolean;
    /** `false` disables polling (one-shot); a number sets the interval in ms. */
    refetchInterval: number | false;
}

/** React Query wrapper around `/v1/fifa/match-results`, returning a slug→match map. */
export function useFifaMatchResults({
    enabled,
    refetchInterval,
}: Options): Map<string, FifaMatchResultData> | undefined {
    const { data } = useQuery({
        queryKey: ['prediction', 'fifa', 'match-results'],
        enabled,
        refetchInterval,
        refetchIntervalInBackground: false,
        retry: false,
        queryFn: async () => {
            const results = await getFifaMatchResults();
            return indexFifaMatchResultsBySlug(results.matches);
        },
    });

    return data;
}
