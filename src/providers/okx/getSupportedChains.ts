import urlcat from 'urlcat';

import { OKX_HOST } from '@/constants/okx.js';
import { fetchFromOKX } from '@/providers/okx/fetchFromOKX.js';
import { type SupportedChainResponse } from '@/providers/okx/types.js';

/**
 * @docs https://www.okx.com/web3/build/docs/waas/dex-get-aggregator-supported-chains
 */
export async function getSupportedChains() {
    const url = urlcat(OKX_HOST, '/api/v5/dex/aggregator/supported/chain');
    const res = await fetchFromOKX<SupportedChainResponse>(url);
    return res.code === 0 ? res.data : undefined;
}
