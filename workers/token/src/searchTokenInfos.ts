import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@dimensiondev/workers-shared/helpers/resolveFireflyResponseData.js';
import { resolveFireflyRootUrl } from '@dimensiondev/workers-shared/helpers/resolveFireflyRootUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';

import type { SearchTokenInfosResponse } from '@/token/src/types.js';

export async function searchTokenInfos(keyword: string, fuzzy: boolean, c: Context) {
    const url = urlcat(resolveFireflyRootUrl(c), '/v2/token/search', {
        query: keyword,
        full: fuzzy ? 0 : 1,
    });
    const response = await fetchJson<SearchTokenInfosResponse>(url, { context: c });
    return resolveFireflyResponseData(response);
}
