import { isAllowedPrefixSlug } from '@/helpers/prediction/polymarket/eventSeriesPills/allowedPrefixes.js';
import { isFutureOpenEvent } from '@/helpers/prediction/polymarket/eventSeriesPills/filterAndSortSeriesEvents.js';
import type { SeriesEventForPills } from '@/helpers/prediction/polymarket/eventSeriesPills/types.js';

/**
 * Polymarket `ep` — slugs considered "live" (first open event with endDate > serverNow).
 */
export function selectLiveSlugSet(
    openEvents: SeriesEventForPills[] | null | undefined,
    serverNow: number,
): Set<string> {
    if (!openEvents?.length) return new Set();

    const live = openEvents.find((event) => isFutureOpenEvent(event, serverNow));
    return live ? new Set([live.slug]) : new Set();
}

/** Whether a pill should show the live indicator (Polymarket ALLOWED_PREFIXES + ep rules). */
export function shouldShowLiveOnPill(eventSlug: string, currentSlug: string, liveSlugs: Set<string>): boolean {
    if (!isAllowedPrefixSlug(eventSlug)) return false;
    return liveSlugs.has(eventSlug) || (eventSlug === currentSlug && liveSlugs.has(currentSlug));
}
