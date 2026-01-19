import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { POLYMARKET_CLOB_API_DOMAIN } from '@/providers/prediction/polymarket/constants.js';
import { resolvePolymarketResponse } from '@/providers/prediction/polymarket/resolvePolymarketResponse.js';
import type { PolymarketMarketPriceResponse } from '@/providers/prediction/polymarket/type.js';

interface Options {
    data: Array<{
        token_id: string;
        side: 'BUY' | 'SELL';
    }>;
}

export async function getPolymarketMarketPrice({ data }: Options) {
    const url = urlcat(POLYMARKET_CLOB_API_DOMAIN, '/prices');
    const response = await fetchJson<PolymarketMarketPriceResponse>(url, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return resolvePolymarketResponse(response);
}
