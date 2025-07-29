import urlcat from 'urlcat';

import { DEBANK_OPEN_API } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { GasPrice, UserTotalBalanceResponse } from '@/providers/types/Debank.js';

export class Debank {
    static async getGasPrice(chain: string) {
        const url = urlcat(DEBANK_OPEN_API, '/v1/wallet/gas_market', {
            chain_id: chain,
        });

        return await fetchJson<GasPrice[]>(url);
    }

    /**
     * @param {string} id - user address
     */
    static async getUserTotalBalance(id: string) {
        const url = urlcat(DEBANK_OPEN_API, '/v1/user/total_balance', {
            id,
        });
        const res = await fetchJson<UserTotalBalanceResponse>(url);
        return res.total_usd_value;
    }
}
