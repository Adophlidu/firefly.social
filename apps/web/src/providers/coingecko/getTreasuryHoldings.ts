import { COINGECKO_ROOT_URL } from '@dimensiondev/constants/static';
import type { PageIndicator } from '@dimensiondev/utils';
import { plus } from '@dimensiondev/web3/numbers';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import type { TreasuryHoldings } from '@/providers/types/CoinGecko.js';

interface Options {
    entity: 'companies' | 'governments';
    coinId: string;
    indicator?: PageIndicator;
    size?: number;
}

/**
 * @Reference https://docs.coingecko.com/reference/companies-public-treasury
 */
async function getTreasuryHoldingList({ entity, coinId, indicator, size = 20 }: Options) {
    const url = urlcat(COINGECKO_ROOT_URL, '/:entity/public_treasury/:coinId', {
        entity,
        coinId,
        per_page: size,
        page: indicator?.id || 1,
    });
    const data = await fetchJson<
        | TreasuryHoldings
        | {
              error: string;
          }
    >(url);
    if ('error' in data) throw new Error(data.error);

    return data;
}

export async function getTreasuryHoldings(coinId: string) {
    const [companyHoldings, governmentHoldings] = await Promise.all([
        getTreasuryHoldingList({ entity: 'companies', coinId }),
        getTreasuryHoldingList({ entity: 'governments', coinId }),
    ]);

    return plus(companyHoldings.total_holdings, governmentHoldings.total_holdings);
}
