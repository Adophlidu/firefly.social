import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { SearchTokenInfosResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function searchTokenInfos(keyword: string, fuzzy = false) {
    if (process.env.NODE_ENV === 'development') console.assert(keyword, 'keyword is required');

    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/token/search', {
        query: keyword,
        full: fuzzy ? 0 : 1,
    });
    const response = await fireflySessionHolder.fetch<SearchTokenInfosResponse>(url);
    return resolveFireflyResponseData(response);
}
