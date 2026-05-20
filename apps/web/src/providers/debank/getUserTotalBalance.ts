import { DEBANK_OPEN_API } from '@dimensiondev/constants/static';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import type { UserTotalBalanceResponse } from '@/providers/types/Debank.js';

/**
 * @param {string} id - user address
 */
export async function getUserTotalBalance(id: string) {
    const url = urlcat(DEBANK_OPEN_API, '/v1/user/total_balance', {
        id,
    });
    const res = await fetchJson<UserTotalBalanceResponse>(url);
    return res.total_usd_value;
}
