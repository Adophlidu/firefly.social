'use client';

import type { Locale } from '@dimensiondev/enums';
import { useQuery } from '@tanstack/react-query';

import { overlaySportEventDataWithFifa } from '@/helpers/prediction/fifaMatchResults.js';
import { resolveSportData } from '@/helpers/prediction/polymarket/resolveSportData.js';
import { FIFA_LIVE_REFETCH_INTERVAL_MS, useFifaMatchResults } from '@/hooks/prediction/useFifaMatchResults.js';
import { getPolymarketEvent } from '@/providers/prediction/polymarket/getEvent.js';
import type { SportEventData } from '@/types/prediction.js';

/** Polymarket detail poll cadence for live sport events. */
const LIVE_DETAIL_POLL_INTERVAL_MS = 10_000;

/**
 * Overlays fresh live data on the SSR detail value: polls Polymarket detail every ~10s and merges
 * FIFA match-results (faster scores + penalty shootout) on top. Only polls while the match is live.
 */
export function useLiveSportEventDetail(
    initial: SportEventData | undefined,
    slug: string | undefined,
    locale?: Locale,
): SportEventData | undefined {
    const { data } = useQuery({
        queryKey: ['prediction', 'sport-event-detail-live', slug, locale],
        enabled: !!slug && !!initial?.live,
        refetchInterval: (query) => {
            const latest = query.state.data ?? initial;
            return latest?.live ? LIVE_DETAIL_POLL_INTERVAL_MS : false;
        },
        refetchIntervalInBackground: false,
        retry: false,
        queryFn: async () => {
            if (!slug) return null;
            const detail = await getPolymarketEvent({ slug, locale });
            if (!detail) return null;
            return resolveSportData(detail);
        },
    });

    const isLive = !!(data ?? initial)?.live;

    const fifaMatchResults = useFifaMatchResults({
        enabled: !!slug,
        refetchInterval: isLive ? FIFA_LIVE_REFETCH_INTERVAL_MS : false,
    });

    if (!initial) return undefined;

    const resolved = data ?? initial;
    const fifa = slug ? fifaMatchResults?.get(slug) : undefined;
    return overlaySportEventDataWithFifa(resolved, fifa);
}
