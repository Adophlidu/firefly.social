import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { POLYMARKET_DATA_API_DOMAIN } from '@/providers/prediction/polymarket/constants.js';
import { resolvePolymarketResponse } from '@/providers/prediction/polymarket/resolvePolymarketResponse.js';
import { type TradedMarketsResponse } from '@/providers/prediction/polymarket/type.js';

export async function getTradedMarketsCount(address: string) {
    const url = urlcat(POLYMARKET_DATA_API_DOMAIN, '/traded', { user: address });
    const response = await fetchJson<TradedMarketsResponse>(url);
    return resolvePolymarketResponse(response);
}
