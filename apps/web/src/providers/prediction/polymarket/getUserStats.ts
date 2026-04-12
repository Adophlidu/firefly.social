import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { POLYMARKET_DATA_API_DOMAIN } from '@/providers/prediction/polymarket/constants.js';
import type { UserStatsResponse } from '@/providers/prediction/polymarket/type.js';

export async function getUserStats(proxyAddress: string): Promise<number | undefined> {
    const url = urlcat(POLYMARKET_DATA_API_DOMAIN, '/v1/user-stats', {
        proxyAddress,
    });
    const response = await fetchJson<UserStatsResponse>(url);
    return response.largestWin;
}
