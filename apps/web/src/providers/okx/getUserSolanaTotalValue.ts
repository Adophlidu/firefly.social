import urlcat from 'urlcat';

import { OKX_HOST } from '@/constants/okx.js';
import { fetchFromOKX } from '@/providers/okx/fetchFromOKX.js';
import type { TotalValueResponse } from '@/providers/okx/types.js';

/**
 * @docs https://www.okx.com/zh-hans/web3/build/docs/waas/walletapi-api-total-token-value-address
 */
export async function getUserSolanaTotalValue(address: string) {
    const url = urlcat(OKX_HOST, '/api/v5/wallet/asset/total-value-by-address', {
        address,
        chains: 501,
    });
    const res = await fetchFromOKX<TotalValueResponse>(url);
    return res.code === 0 ? res.data[0]?.totalValue : undefined;
}
