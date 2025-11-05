import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { CoinGeckoToken } from '@/providers/types/CoinGecko.js';
import type { GetTokenOptions, Response } from '@/providers/types/Firefly.js';

export async function searchToken(options: GetTokenOptions): Promise<CoinGeckoToken | null> {
    const response: Response<{ token: CoinGeckoToken }> = await fetchJson(
        urlcat(FIREFLY_WORKER_HOST, '/token/search', options),
    );
    return response.data?.token || null;
}
