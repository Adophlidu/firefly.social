import urlcat from 'urlcat';

import { OKX_HOST } from '@/constants/okx.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { SupportedChainResponse, TotalValueResponse } from '@/providers/okx/types.js';

/** request okx official API, and normalize the code */
async function fetchFromOKX<T extends { code: number }>(input: RequestInfo | URL, init?: RequestInit) {
    if (process.env.NODE_ENV === 'development') {
        if (typeof input === 'string' && input.includes('0x00000')) {
            console.warn('Do you forget to convert to okx native address?', input);
        }
    }
    const response = await fetchJson<T>(input, init);
    return {
        ...response,
        code: +response.code,
    };
}

export class OKX {
    /**
     * @docs https://www.okx.com/web3/build/docs/waas/dex-get-aggregator-supported-chains
     */
    static async getSupportedChains() {
        const url = urlcat(OKX_HOST, '/api/v5/dex/aggregator/supported/chain');
        const res = await fetchFromOKX<SupportedChainResponse>(url);
        return res.code === 0 ? res.data : undefined;
    }
    /**
     * @docs https://www.okx.com/zh-hans/web3/build/docs/waas/walletapi-api-total-token-value-address
     */
    static async getUserSolanaTotalValue(address: string) {
        const url = urlcat(OKX_HOST, '/api/v5/wallet/asset/total-value-by-address', {
            address,
            chains: 501,
        });
        const res = await fetchFromOKX<TotalValueResponse>(url);
        return res.code === 0 ? res.data[0]?.totalValue : undefined;
    }
}
