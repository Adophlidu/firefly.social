import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { PolymarketSportsListRequest, PolymarketSportsListResponse, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getSportsEventList(body: PolymarketSportsListRequest) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/polymarket/sports/list');
    const response = await fetchJson<Response<PolymarketSportsListResponse>>(url, {
        method: 'POST',
        body: JSON.stringify(body),
    });
    const data = resolveFireflyResponseData(response);
    if (!data) {
        return {
            timezone: body.timezone || 'UTC',
            live: [],
            today: [],
            tomorrow: [],
            afterTomorrow: [],
            afterThreeDays: [],
            closed: [],
        } satisfies PolymarketSportsListResponse;
    }
    return data;
}
