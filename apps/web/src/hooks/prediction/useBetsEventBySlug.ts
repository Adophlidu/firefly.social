'use client';

import { PredictionPlatform, Source } from '@dimensiondev/enums';
import { skipToken, useQuery } from '@tanstack/react-query';

import { STALE_TIMES } from '@/constants/query.js';
import { useLocale } from '@/hooks/useLocale.js';
import { getEventDetail } from '@/providers/firefly/prediction/getEventDetail.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

/**
 * Fetch a Polymarket prediction event by its slug. Uses the same query key as
 * `PredictionContext` (`[Source.Prediction, 'event', platform, slug]`) so the
 * cache is shared with the event-detail page — opening a card then the detail
 * page does not refetch.
 */
export function useBetsEventBySlug(slug: string | undefined): BetsEventDataForUI | undefined {
    const locale = useLocale();
    const { data } = useQuery({
        queryKey: [Source.Prediction, 'event', PredictionPlatform.Polymarket, slug],
        staleTime: STALE_TIMES.MINUTE_30,
        enabled: !!slug,
        queryFn: !slug
            ? skipToken
            : () =>
                  getEventDetail(PredictionPlatform.Polymarket, {
                      id: slug,
                      isMutil: false,
                      locale,
                  }),
    });
    return data ?? undefined;
}
