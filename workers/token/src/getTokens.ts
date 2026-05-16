import { DSEARCH_BASE_URL } from '@dimensiondev/workers-shared/constants/metadata.js';
import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';

import type { CoinGeckoTokenInfosResponse } from '@/token/src/types.js';

export async function getTokens(c: Context) {
    const url = urlcat(DSEARCH_BASE_URL, '/fungible-tokens/coingecko.json');
    return fetchJson<CoinGeckoTokenInfosResponse>(url, { context: c });
}
