import { createIndicator, createPageable } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fixCollection } from '@/providers/firefly/endpoint/fixCollection.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { SearchNFTResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function searchCollectionsByKeyword(keyword: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/search/collectible', {
        keyword,
    });
    const response = await fireflySessionHolder.fetch<SearchNFTResponse>(url);
    const data = resolveFireflyResponseData(response);
    return createPageable((data.list || []).map(fixCollection), createIndicator(undefined));
}
