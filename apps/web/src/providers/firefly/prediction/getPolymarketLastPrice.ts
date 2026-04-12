import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { PolymarketLastPriceData, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getPolymarketLastPrice(tokenIds: string[], signal?: AbortSignal) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/polymarket/v1/polymarket/last-price', {
        token_ids: tokenIds.join(','),
    });
    const response = await fireflySessionHolder.fetchWithoutSession<Response<PolymarketLastPriceData[]>>(url, {
        signal,
    });
    return resolveFireflyResponseData(response);
}
