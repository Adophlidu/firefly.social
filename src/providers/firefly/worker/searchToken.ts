import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import type { CoinGeckoToken } from '@/providers/types/CoinGecko.js';
import type { GetTokenOptions } from '@/providers/types/Firefly.js';
import type { ResponseJson } from '@/types/utility.js';

export async function searchToken(options: GetTokenOptions): Promise<CoinGeckoToken | null> {
    const response = await fetchJson<ResponseJson<CoinGeckoToken | null>>(
        urlcat(FIREFLY_WORKER_HOST, '/token/search', options),
    );
    return resolveResponseData(response);
}
