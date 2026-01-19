import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getPolymarketSpreads(tokenIds: string[], signal?: AbortSignal) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/polymarket/v1/polymarket/spreads', {
        token_ids: tokenIds.join(','),
    });
    const response = await fireflySessionHolder.fetchWithoutSession<Response<Record<string, string>>>(url, {
        signal,
    });
    return resolveFireflyResponseData(response);
}
