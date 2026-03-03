import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { POLYMARKET_CLOB_API_DOMAIN } from '@/providers/prediction/polymarket/constants.js';
import { resolvePolymarketResponse } from '@/providers/prediction/polymarket/resolvePolymarketResponse.js';
import {
    type PolymarketPriceHistoryResponse,
    type PriceHistoryInterval,
} from '@/providers/prediction/polymarket/type.js';

interface Options {
    market: string;
    startTs?: number;
    endTs?: number;
    interval?: PriceHistoryInterval;
    fidelity?: number; // in minutes
    signal?: AbortSignal;
}

export async function getPriceHistory({ signal, ...options }: Options) {
    const url = urlcat(POLYMARKET_CLOB_API_DOMAIN, '/prices-history', options);
    const response = await fetchJson<PolymarketPriceHistoryResponse>(url, { signal });
    return resolvePolymarketResponse(response);
}
