import urlcat from 'urlcat';
import { COINGECKO_URL_BASE } from '../constants.js';
import type { CoinInfo } from '../types.js';
import { fetchCachedJSON } from '../../helpers/fetchJSON.js';

function fetchFromCoinGecko<T>(request: RequestInfo | URL, init?: RequestInit) {
    return fetchCachedJSON<T>(request, init);
}

export async function getCoinInfo(coinId: string) {
    return fetchFromCoinGecko<
        | CoinInfo
        | {
              error: string;
          }
    >(
        urlcat(COINGECKO_URL_BASE, `/coins/${coinId}`, {
            developer_data: false,
            community_data: false,
            tickers: true,
        }),
        {
            cache: 'default',
        },
    );
}
