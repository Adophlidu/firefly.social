import type { PolymarketSportsEvent, PolymarketSportsListResponse } from '@/providers/types/Firefly.js';

/**
 * Esports events are reliably identified by a tag whose slug is `esports`. Regular sports
 * events do not carry this tag — this holds even for Counter-Strike/Valorant, whose
 * `sport.sport` field is empty, so checking the tag is the dependable signal.
 */
export function isEsportSportsEvent(event: PolymarketSportsEvent): boolean {
    return event.tags?.some((tag) => tag.slug === 'esports') ?? false;
}

/**
 * Returns a new response with every esports event removed from each time bucket.
 *
 * The backend's Sports `live` branch still leaks esports events (LoL/CS2/Dota2/Valorant),
 * so we strip them client-side before grouping for display. A no-op for responses that
 * contain no esports events (e.g. non-Sports categories).
 */
export function excludeEsportEvents(response: PolymarketSportsListResponse): PolymarketSportsListResponse {
    return {
        ...response,
        live: response.live.filter((event) => !isEsportSportsEvent(event)),
        today: response.today.filter((event) => !isEsportSportsEvent(event)),
        tomorrow: response.tomorrow.filter((event) => !isEsportSportsEvent(event)),
        afterTomorrow: response.afterTomorrow.filter((event) => !isEsportSportsEvent(event)),
        afterThreeDays: response.afterThreeDays?.filter((event) => !isEsportSportsEvent(event)),
        closed: response.closed.filter((event) => !isEsportSportsEvent(event)),
    };
}
