import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolvePolymarketResponse } from '@/providers/polymarket/resolvePolymarketResponse.js';
import type { TradedMarketsResponse } from '@/providers/polymarket/type.js';

const dataApiDomain = 'https://data-api.polymarket.com';

export class PolymarketDataApi {
    static async getTradedMarketsCount(address: string) {
        const url = urlcat(dataApiDomain, '/traded', { user: address });
        const response = await fetchJson<TradedMarketsResponse>(url);
        return resolvePolymarketResponse(response);
    }
}
