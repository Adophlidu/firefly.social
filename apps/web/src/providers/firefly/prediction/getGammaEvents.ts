import type { Locale } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { PolymarketEventListData, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export const GAMMA_EVENTS_PAGE_SIZE = 20;

export interface GetGammaEventsOptions {
    tag_slug: string;
    limit?: number;
    offset?: number;
    active?: boolean;
    closed?: boolean;
    archived?: boolean;
    order?: string;
    ascending?: boolean;
    exclude_tag_id?: string;
    locale?: Locale;
}

export async function getGammaEvents({
    tag_slug,
    limit = GAMMA_EVENTS_PAGE_SIZE,
    offset = 0,
    active = true,
    closed = false,
    archived = false,
    order = 'volume',
    ascending = false,
    exclude_tag_id,
    locale,
}: GetGammaEventsOptions): Promise<PolymarketEventListData[]> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/polymarket/gamma/events', {
        tag_slug,
        limit,
        offset,
        active,
        closed,
        archived,
        order,
        ascending,
        ...(exclude_tag_id ? { exclude_tag_id } : {}),
        locale,
    });
    const response = await fetchJson<Response<PolymarketEventListData[]>>(url, {
        method: 'GET',
    });
    const data = resolveFireflyResponseData(response);

    return Array.isArray(data) ? data : [];
}
