import { COINGECKO_API_URL } from '@dimensiondev/workers-shared/constants/metadata.js';
import { chunk } from '@dimensiondev/workers-shared/helpers/chunk.js';
import { fetchCoinGecko } from '@dimensiondev/workers-shared/helpers/fetchCoinGecko.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';

import type { CoinGeckoCoinMarketInfosResponse } from '@/token/src/types.js';

async function getCoinMarketInfosByIdChunk(idChunk: string[], c: Context) {
    const url = urlcat(COINGECKO_API_URL, '/coins/markets', {
        ids: idChunk.join(','),
        vs_currency: 'usd',
        per_page: idChunk.length,
        page: 1,
        include_rehypothecated: 'true',
    });
    const infos = await fetchCoinGecko<CoinGeckoCoinMarketInfosResponse>(url, { context: c });
    return infos;
}

export async function getCoinMarketInfosByIds(coinIds: string[], c: Context) {
    const chunks = chunk(coinIds, 10);
    const responses = await Promise.allSettled(chunks.map((chunk) => getCoinMarketInfosByIdChunk(chunk, c)));
    return responses.flatMap((x) => (x.status === 'fulfilled' ? x.value : []));
}
