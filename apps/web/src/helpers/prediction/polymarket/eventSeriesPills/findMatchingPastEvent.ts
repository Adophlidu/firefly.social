import type { PastResultRow, SeriesEventForPills } from '@/helpers/prediction/polymarket/eventSeriesPills/types.js';

function getEventStartMs(event: SeriesEventForPills): number {
    const fromMarket = event.markets?.[0]?.eventStartTime;
    if (fromMarket) return new Date(fromMarket).getTime();
    if (event.startTime) return new Date(event.startTime).getTime();
    if (event.startDate) return new Date(event.startDate).getTime();
    return 0;
}

/** Polymarket `findMatchingPastEvent` (module 162923). */
export function findMatchingPastEvent(
    pastResult: PastResultRow,
    pastEvents: SeriesEventForPills[],
    isDailyUpOrDown: boolean,
): SeriesEventForPills | null {
    if (!pastEvents.length) return null;

    const targetMs = new Date(pastResult.startTime).getTime();

    for (const event of pastEvents) {
        const eventMs = getEventStartMs(event);
        if (!eventMs) continue;

        if (isDailyUpOrDown) {
            if (new Date(targetMs).setUTCHours(0, 0, 0, 0) === new Date(eventMs).setUTCHours(0, 0, 0, 0)) {
                return event;
            }
        } else if (Math.abs(targetMs - eventMs) < 60_000) {
            return event;
        }
    }

    return null;
}
