import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { POLYMARKET_DATA_API_DOMAIN } from '@/providers/prediction/polymarket/constants.js';
import { resolvePolymarketResponse } from '@/providers/prediction/polymarket/resolvePolymarketResponse.js';
import type { TopHoldersResponse } from '@/providers/prediction/polymarket/type.js';

interface Options {
    ids: string[];
    limit?: number;
    minBalance?: number;
    signal?: AbortSignal;
}

export async function getTopHolders({ ids, limit, minBalance, signal }: Options) {
    const url = urlcat(POLYMARKET_DATA_API_DOMAIN, '/holders', {
        market: ids.join(','),
        limit,
        minBalance,
    });
    const response = await fetchJson<TopHoldersResponse>(url, { signal });
    return resolvePolymarketResponse(response);
}
