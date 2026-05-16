import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@dimensiondev/workers-shared/helpers/resolveFireflyResponseData.js';
import { resolveFireflyRootUrl } from '@dimensiondev/workers-shared/helpers/resolveFireflyRootUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';

import type { GetTokenOptions, TokenWithMarketDataResponse } from '@/token/src/types.js';

export async function getSingleCoin(options: GetTokenOptions, c: Context) {
    const url = urlcat(resolveFireflyRootUrl(c), '/v2/token/single_token', options as Record<string, string>);
    const response = await fetchJson<TokenWithMarketDataResponse>(url, { context: c });
    return resolveFireflyResponseData(response);
}
