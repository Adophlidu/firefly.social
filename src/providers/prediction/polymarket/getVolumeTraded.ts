import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { POLYMARKET_LAB_API_DOMAIN } from '@/providers/prediction/polymarket/constants.js';
import { resolvePolymarketResponse } from '@/providers/prediction/polymarket/resolvePolymarketResponse.js';
import { type VolumeTradedResponse } from '@/providers/prediction/polymarket/type.js';

export async function getVolumeTraded(address: string) {
    const url = urlcat(POLYMARKET_LAB_API_DOMAIN, '/volume', {
        window: 'all',
        limit: 1,
        address,
    });
    const response = await fetchJson<VolumeTradedResponse>(url);
    return resolvePolymarketResponse(response);
}
