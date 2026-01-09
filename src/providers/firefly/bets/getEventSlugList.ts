import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type PolymarketEventSlugListData, type Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getEventSlugList() {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/polymarket/slugs/list');
    const response = await fireflySessionHolder.fetch<Response<PolymarketEventSlugListData[]>>(url);
    return resolveFireflyResponseData(response);
}
