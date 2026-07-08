import type { PolymarketSportsEvent, PolymarketSportsListResponse } from '@/providers/types/Firefly.js';

/** Latest `[home, away]` from an event's score timeline; `undefined` when none is recorded (e.g. not started). */
function getLatestScore(event: PolymarketSportsEvent): [number, number] | undefined {
    const scores = event.score_show?.at(-1)?.score;
    if (!scores || scores.length < 2) return undefined;
    const [home, away] = scores;
    if (!Number.isFinite(home) || !Number.isFinite(away)) return undefined;
    return [home, away];
}

/** `true` when an event's latest score is level (home === away) — the precondition for a penalty shootout. */
export function isSportsEventScoreTied(event: PolymarketSportsEvent): boolean {
    const score = getLatestScore(event);
    return !!score && score[0] === score[1];
}

/** `true` when any event across the list buckets is level — i.e. the FIFA penalty feed may be needed. */
export function sportsListHasTiedScore(response: PolymarketSportsListResponse | undefined): boolean {
    if (!response) return false;
    const buckets: PolymarketSportsEvent[][] = [
        response.live,
        response.today,
        response.tomorrow,
        response.afterTomorrow,
        response.closed,
    ];
    if (response.afterThreeDays) buckets.push(response.afterThreeDays);
    return buckets.some((events) => events.some(isSportsEventScoreTied));
}
