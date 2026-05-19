import type { SeriesEventForPills } from '@/helpers/prediction/polymarket/eventSeriesPills/types.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

/** Map UI event to logic-layer series pill shape. */
export function toSeriesEventForPills(event: BetsEventDataForUI): SeriesEventForPills {
    return {
        slug: event.slug ?? event.id,
        endDate: event.endDate,
        startDate: event.startDate,
        startTime: event.startTime,
        closed: event.closed ?? event.status === 'ended',
        markets: event.markets.length ? [{ eventStartTime: event.startTime }] : [{ eventStartTime: event.startTime }],
    };
}

/** Derive up/down outcome from resolved market when past-results API is unavailable. */
export function resolveOutcomeFromUiEvent(event: BetsEventDataForUI): 'up' | 'down' | null {
    const market = event.markets[0];
    if (!market?.resolvedOutcomeId) return null;
    const outcome = market.outcomes.find((o) => o.id === market.resolvedOutcomeId)?.label;
    if (!outcome) return null;
    const lower = outcome.toLowerCase();
    if (lower === 'up' || lower === 'yes') return 'up';
    if (lower === 'down' || lower === 'no') return 'down';
    return null;
}
