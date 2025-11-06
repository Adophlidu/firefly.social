import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { CoinGeckoCoinMarketInfo } from '@/providers/types/CoinGecko.js';
import type { SearchableToken } from '@/providers/types/Firefly.js';

export type TokenWithMarket = SearchableToken & { market?: Partial<CoinGeckoCoinMarketInfo> };

/**
 * Search by keyword or address
 */
export async function searchTokens(searchKeyword: string, fuzzy?: boolean): Promise<TokenWithMarket[]> {
    const response = await fetchJson<TokenWithMarket[]>(
        urlcat(FIREFLY_WORKER_HOST, '/token/search-bulk', {
            keyword: searchKeyword,
            fuzzy,
        }),
    );
    return response;
}
