import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@dimensiondev/workers-shared/helpers/resolveFireflyResponseData.js';
import { resolveFireflyRootUrl } from '@dimensiondev/workers-shared/helpers/resolveFireflyRootUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';

import type { CoinGeckoCoinInfoResponse } from '@/token/src/types.js';

export async function getCoinInfo(coinId: string, c: Context) {
    if (coinId.trim().includes(' ')) throw new Error('Invalid coinId');

    const url = urlcat(resolveFireflyRootUrl(c), '/v1/token/coins', {
        coingecko_id: coinId,
        developer_data: false,
        community_data: false,
        localization: false,
    });
    const response = await fetchJson<CoinGeckoCoinInfoResponse>(url, {
        context: c,
    });
    return resolveFireflyResponseData(response);
}
