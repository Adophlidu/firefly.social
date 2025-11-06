import urlcat from 'urlcat';

import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fixCollection } from '@/providers/firefly/Nft.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { SearchNFTResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function searchCollections(keyword: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/search/collectible', {
        keyword,
    });

    const response = await fireflySessionHolder.fetch<SearchNFTResponse>(url, {
        method: 'GET',
    });
    const data = resolveFireflyResponseData(response);

    return createPageable((data.list || []).map(fixCollection), createIndicator(undefined));
}
