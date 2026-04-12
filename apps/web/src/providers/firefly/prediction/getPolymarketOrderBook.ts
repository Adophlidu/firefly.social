import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { PolymarketOrderBookData, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getPolymarketOrderBook(token_id: string, signal?: AbortSignal) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/polymarket/v1/polymarket/book', {
        token_id,
    });
    const response = await fireflySessionHolder.fetchWithoutSession<Response<PolymarketOrderBookData | null>>(url, {
        signal,
    });
    return resolveFireflyResponseData(response);
}

export async function getPolymarketOrderBooks(tokenIds: string[], signal?: AbortSignal) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/polymarket/v1/polymarket/books');
    const response = await fireflySessionHolder.fetchWithoutSession<Response<PolymarketOrderBookData[] | null>>(url, {
        method: 'POST',
        body: JSON.stringify({ token_ids: tokenIds }),
        signal,
    });
    return resolveFireflyResponseData(response);
}
