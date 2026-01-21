import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { POLYMARKET_DATA_API_DOMAIN } from '@/providers/prediction/polymarket/constants.js';
import { resolvePolymarketResponse } from '@/providers/prediction/polymarket/resolvePolymarketResponse.js';
import type { PolymarketResponse, PolymarketUserPosition } from '@/providers/prediction/polymarket/type.js';

interface Options {
    user: string;
    market?: string[];
    eventId?: string[];
    sizeThreshold?: number; // default to 1
    redeemable?: boolean; // default to false
    mergeable?: boolean; // default to false
    limit?: number; // default to 100
    offset?: number; // default to 0
    sortBy?: 'CURRENT' | 'INITIAL' | 'TOKENS' | 'CASHPNL' | 'PERCENTPNL';
    sortDirection?: 'ASC' | 'DESC';
}

export async function getPolymarketUserCurrentPositions(options: Options) {
    const url = urlcat(POLYMARKET_DATA_API_DOMAIN, '/positions', {
        ...options,
        market: options.market?.join(','),
        eventId: options.eventId?.join(','),
        sortBy: options.sortBy ?? 'CURRENT',
        sortDirection: options.sortDirection ?? 'DESC',
    });
    const response = await fetchJson<PolymarketResponse<PolymarketUserPosition[]>>(url);
    return resolvePolymarketResponse(response);
}
