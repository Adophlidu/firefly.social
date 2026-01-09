import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolvePolymarketResponse } from '@/providers/polymarket/resolvePolymarketResponse.js';
import { type VolumeTradedResponse } from '@/providers/polymarket/type.js';

const POLYMARKET_LAB_API_DOMAIN = 'https://lb-api.polymarket.com';

export async function getVolumeTraded(address: string) {
    const url = urlcat(POLYMARKET_LAB_API_DOMAIN, '/volume', {
        window: 'all',
        limit: 1,
        address,
    });
    const response = await fetchJson<VolumeTradedResponse>(url);
    return resolvePolymarketResponse(response);
}
