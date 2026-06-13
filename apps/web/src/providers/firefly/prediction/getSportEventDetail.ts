import type { Locale } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { PolymarketSportDetail } from '@/providers/prediction/polymarket/type.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

/**
 * The sport-detail API accepts the same locale values as our `Locale` enum
 * (zh-Hans / zh-Hant / es / ko / ja / en), so the locale is passed straight through.
 * Downstream classification is slug-driven, so this only affects the displayed
 * (translated) `groupItemTitle`, not the grouping/merging.
 */
export async function getSportEventDetail(slug: string, locale?: Locale): Promise<PolymarketSportDetail | null> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/polymarket/sports/detail', { slug, locale });
    const response = await fetchJson<Response<PolymarketSportDetail>>(url);
    const result = resolveFireflyResponseData(response);
    if (!result) return null;
    return result;
}
