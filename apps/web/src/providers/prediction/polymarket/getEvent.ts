import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolvePolymarketResponse } from '@/providers/prediction/polymarket/resolvePolymarketResponse.js';
import type { PolymarketEventResponse } from '@/providers/prediction/polymarket/type.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

async function getPolymarketEventBySlug(slug: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, `/v1/polymarket/event/detail`, { slug });
    const response = await fetchJson<Response<PolymarketEventResponse>>(url);
    const result = resolveFireflyResponseData(response);
    return resolvePolymarketResponse(result);
}

async function getPolymarketEventById(id: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, `/v1/polymarket/event/detail`, { event_id: id });
    const response = await fetchJson<Response<PolymarketEventResponse>>(url);
    const result = resolveFireflyResponseData(response);
    return resolvePolymarketResponse(result);
}

export async function getPolymarketEvent({ id, slug }: { id?: string; slug?: string }) {
    if (id) return getPolymarketEventById(id);
    if (slug) return getPolymarketEventBySlug(slug);

    throw new Error('Either id or slug must be provided');
}
