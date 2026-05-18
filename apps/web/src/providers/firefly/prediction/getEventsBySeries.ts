import { PredictionPlatform } from '@dimensiondev/enums';
import { NotImplementedError, unreachable } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { formatPolymarketEvent } from '@/providers/firefly/prediction/formatEvents.js';
import type { PolymarketEvent } from '@/providers/prediction/polymarket/type.js';
import type { ResponseJson } from '@/types/utility.js';

async function getPolymarketEventsBySeries(seriesId: string, limit = 20, cursor?: string) {
    const url = urlcat('/api/polymarket/events', {
        seriesId,
        limit,
        order: 'endDate',
        ascending: false,
        after_cursor: cursor,
    });
    const response = await fetchJson<
        ResponseJson<{
            events: PolymarketEvent[];
            next_cursor?: string;
        }>
    >(url);
    return resolveResponseData(response);
}

async function getPolymarketEventsBySeriesWithCount(seriesId: string, limit = 20) {
    const events: PolymarketEvent[] = [];
    let nextCursor: string | undefined = undefined;

    do {
        const response = await getPolymarketEventsBySeries(seriesId, limit, nextCursor);
        events.push(...response.events);
        nextCursor = response.next_cursor;
    } while (nextCursor && events.length < limit);

    return events.slice(0, limit).map(formatPolymarketEvent);
}

export async function getEventsBySeries(platform: PredictionPlatform, seriesId: string, limit = 20) {
    switch (platform) {
        case PredictionPlatform.Polymarket:
            return getPolymarketEventsBySeriesWithCount(seriesId, limit);
        case PredictionPlatform.Opinion:
            throw new NotImplementedError();
        default:
            unreachable(platform);
    }
}
