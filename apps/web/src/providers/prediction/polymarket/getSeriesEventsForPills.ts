import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { formatPolymarketEvent } from '@/providers/firefly/prediction/formatEvents.js';
import type { PolymarketEvent } from '@/providers/prediction/polymarket/type.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';
import type { ResponseJson } from '@/types/utility.js';

interface SeriesEventsQuery {
    seriesId: string;
    seriesSlug?: string;
    closed?: boolean;
    active?: boolean;
    archived?: boolean;
    order?: string;
    ascending?: boolean;
    limit?: number;
}

async function fetchSeriesEvents(query: SeriesEventsQuery): Promise<PolymarketEvent[]> {
    const url = urlcat('/api/polymarket/events', {
        seriesId: query.seriesId,
        limit: query.limit ?? 100,
        order: query.order ?? 'endDate',
        ascending: query.ascending ?? false,
        ...(query.closed !== undefined ? { closed: String(query.closed) } : {}),
        ...(query.active !== undefined ? { active: String(query.active) } : {}),
        ...(query.archived !== undefined ? { archived: String(query.archived) } : {}),
    });

    const response = await fetchJson<
        ResponseJson<{
            events: PolymarketEvent[];
            next_cursor?: string;
        }>
    >(url);

    const data = resolveResponseData(response);
    return data?.events ?? [];
}

/** Polymarket open series events: closed=false, active=true, ascending endDate, limit 100. */
export async function getPolymarketSeriesEventsOpen(
    seriesId: string,
    _seriesSlug?: string,
): Promise<BetsEventDataForUI[]> {
    const events = await fetchSeriesEvents({
        seriesId,
        closed: false,
        active: true,
        archived: false,
        order: 'endDate',
        ascending: true,
        limit: 100,
    });
    return events.map(formatPolymarketEvent);
}

/** Polymarket past series events: closed=true, descending endDate, limit 50. */
export async function getPolymarketSeriesEventsPast(
    seriesId: string,
    _seriesSlug?: string,
): Promise<BetsEventDataForUI[]> {
    const events = await fetchSeriesEvents({
        seriesId,
        closed: true,
        active: true,
        archived: false,
        order: 'endDate',
        ascending: false,
        limit: 50,
    });
    return events.map(formatPolymarketEvent);
}
