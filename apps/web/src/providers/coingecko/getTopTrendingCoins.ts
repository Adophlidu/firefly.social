import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { formatTrendingToken } from '@/helpers/formatTrendingToken.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { type TrendingTokensResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getTopTrendingCoins() {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/token/trending', {
        page: 1,
        sort: 'h1_trending',
    });

    const response = await fetchJson<TrendingTokensResponse>(url);

    const data = resolveFireflyResponseData(response);

    const formattedData = data.map((item) => formatTrendingToken(item, 'h1'));
    return formattedData;
}
