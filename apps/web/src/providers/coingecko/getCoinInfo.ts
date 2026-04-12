import urlcat from 'urlcat';

import { COINGECKO_ROOT_URL } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { CoinGeckoCoinInfo } from '@/providers/types/CoinGecko.js';

export function getCoinInfo(coinId: string) {
    if (coinId.trim().includes(' ')) {
        throw new Error('Invalid coinId');
    }
    return fetchJson<
        | CoinGeckoCoinInfo
        | {
              error: string;
          }
    >(
        urlcat(COINGECKO_ROOT_URL, `/coins/${coinId}`, {
            developer_data: false,
            community_data: false,
            localization: false,
        }),
    );
}
