import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { TrendingNFTsResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getTrendingNFTs(size = 20) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/trending', { size });
    const response = await fetchJson<TrendingNFTsResponse>(url);
    return resolveFireflyResponseData(response);
}
