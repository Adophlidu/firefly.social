import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { PolymarketSportsEvent, PolymarketSportsListResponse, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export interface PolymarketSportsLiveListResponse {
    list: PolymarketSportsEvent[];
}

const EMPTY_SPORTS_LIST_RESPONSE = (timezone: string): PolymarketSportsListResponse => ({
    timezone,
    live: [],
    today: [],
    tomorrow: [],
    afterTomorrow: [],
    closed: [],
});

export function toSportsListResponseFromLiveList(
    data: PolymarketSportsLiveListResponse | null | undefined,
): PolymarketSportsListResponse {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!data?.list?.length) {
        return EMPTY_SPORTS_LIST_RESPONSE(timezone);
    }

    return {
        timezone,
        live: data.list,
        today: [],
        tomorrow: [],
        afterTomorrow: [],
        closed: [],
    };
}

export async function getSportsLiveEventList(): Promise<PolymarketSportsListResponse> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/polymarket/sports/live/list');
    const response = await fetchJson<Response<PolymarketSportsLiveListResponse>>(url, {
        method: 'GET',
    });
    const data = resolveFireflyResponseData(response);
    return toSportsListResponseFromLiveList(data);
}
