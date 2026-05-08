import { NotImplementedError, unreachable } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { PredictionPlatform } from '@/constants/enum.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { formatPolymarketEvent } from '@/providers/firefly/prediction/formatEvents.js';
import type { PolymarketEvent } from '@/providers/prediction/polymarket/type.js';
import type { ResponseJson } from '@/types/utility.js';

export async function getEventsBySeries(platform: PredictionPlatform, seriesId: string, limit = 20) {
    switch (platform) {
        case PredictionPlatform.Polymarket: {
            const url = urlcat('/api/polymarket/events', {
                seriesId,
                limit,
                order: 'endDate',
                ascending: false,
            });
            const response = await fetchJson<
                ResponseJson<{
                    events: PolymarketEvent[];
                }>
            >(url);
            const events = resolveResponseData(response).events;
            return events.map(formatPolymarketEvent);
        }
        case PredictionPlatform.Opinion:
            throw new NotImplementedError();
        default:
            unreachable(platform);
    }
}
