import { EMPTY_LIST } from '@dimensiondev/constants';
import { createIndicator, createPageable } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { SearchTokenResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function searchTokens(query: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/token/search_data', {
        query,
    });
    const response = await fireflySessionHolder.fetch<SearchTokenResponse>(url);
    const data = resolveFireflyResponseData(response);

    return createPageable(data.coins ?? EMPTY_LIST, createIndicator(undefined));
}
