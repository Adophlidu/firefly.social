import type { SeriesEventForPills } from '@/helpers/prediction/polymarket/eventSeriesPills/types.js';

/** Polymarket `eG` — open events only. */
export function isOpenSeriesEvent(event: SeriesEventForPills): boolean {
    return !event.closed;
}

/** Polymarket `eK` — closed events only. */
export function isClosedSeriesEvent(event: SeriesEventForPills): boolean {
    return !!event.closed;
}

function parseEndMs(event: SeriesEventForPills): number {
    const raw = event.endDate ?? event.eventDate;
    return raw ? new Date(raw).getTime() : 0;
}

function isValidDate(ms: number): boolean {
    return Number.isFinite(ms) && ms > 0;
}

/** Polymarket `eZ` / `eJ` — sort by endDate ascending. */
export function sortSeriesEventsByEndDateAsc(a: SeriesEventForPills, b: SeriesEventForPills): number {
    return parseEndMs(a) - parseEndMs(b);
}

/** Polymarket `eY` — sort by endDate descending, slug tie-break. */
export function sortSeriesEventsByEndDateDesc(a: SeriesEventForPills, b: SeriesEventForPills): number {
    const aMs = parseEndMs(a);
    const bMs = parseEndMs(b);
    const aValid = isValidDate(aMs);
    const bValid = isValidDate(bMs);

    if (!aValid && !bValid) return 0;
    if (aValid && !bValid) return -1;
    if (!aValid && bValid) return 1;
    if (aMs === bMs) return b.slug.localeCompare(a.slug);
    return bMs - aMs;
}

export function filterAndSortOpenEvents(events: SeriesEventForPills[]): SeriesEventForPills[] {
    return [...events].filter(isOpenSeriesEvent).sort(sortSeriesEventsByEndDateAsc);
}

export function filterAndSortPastEvents(events: SeriesEventForPills[]): SeriesEventForPills[] {
    return [...events].filter(isClosedSeriesEvent).sort(sortSeriesEventsByEndDateDesc);
}

/** Polymarket `eX` — next open event end is still in the future. */
export function isFutureOpenEvent(event: SeriesEventForPills, serverNow: number): boolean {
    return parseEndMs(event) > serverNow;
}

/** Polymarket `e0` — pick event with max endDate. */
export function pickLatestEndDateEvent(
    accumulator: SeriesEventForPills,
    candidate: SeriesEventForPills,
): SeriesEventForPills {
    return parseEndMs(candidate) > parseEndMs(accumulator) ? candidate : accumulator;
}
