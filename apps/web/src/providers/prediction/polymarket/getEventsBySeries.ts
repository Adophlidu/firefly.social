import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { POLYMARKET_GAMMA_API_DOMAIN } from '@/providers/prediction/polymarket/constants.js';
import { resolvePolymarketResponse } from '@/providers/prediction/polymarket/resolvePolymarketResponse.js';
import type { PolymarketEvent, PolymarketResponse } from '@/providers/prediction/polymarket/type.js';

interface Options {
    limit?: number; // default 20 max 500
    order?: string;
    ascending?: boolean;
    start_date_min?: string;
    start_date_max?: string;
    include_chat?: boolean;
    start_time_min?: string;
    start_time_max?: string;
    end_date_min?: string;
    end_date_max?: string;
}

export async function getPolymarketEventsBySeries(seriesId: string, options?: Options) {
    const url = urlcat(POLYMARKET_GAMMA_API_DOMAIN, '/events/keyset', {
        ...options,
        series_id: seriesId,
    });
    const response = await fetchJson<
        PolymarketResponse<{
            events: PolymarketEvent[];
            next_cursor?: string;
        }>
    >(url);
    return resolvePolymarketResponse(response);
}
