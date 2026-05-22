import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { PolymarketSportDetail } from '@/providers/prediction/polymarket/type.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getSportEventDetail(slug: string): Promise<PolymarketSportDetail | null> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/polymarket/sports/detail', { slug });
    const response = await fetchJson<Response<PolymarketSportDetail>>(url);
    const result = resolveFireflyResponseData(response);
    if (!result) return null;
    return result;
}
