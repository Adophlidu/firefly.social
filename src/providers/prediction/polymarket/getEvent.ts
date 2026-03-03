import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { POLYMARKET_MARKET_API_DOMAIN } from '@/providers/prediction/polymarket/constants.js';
import { resolvePolymarketResponse } from '@/providers/prediction/polymarket/resolvePolymarketResponse.js';
import { type PolymarketEventResponse } from '@/providers/prediction/polymarket/type.js';

interface Options {
    include_chat?: boolean;
    include_template?: boolean;
}

async function getPolymarketEventBySlug(slug: string, options?: Options) {
    const url = urlcat(POLYMARKET_MARKET_API_DOMAIN, `/events/slug/${slug}`, options || {});
    const response = await fetchJson<PolymarketEventResponse>(url);
    return resolvePolymarketResponse(response);
}

async function getPolymarketEventById(id: string, options?: Options) {
    const url = urlcat(POLYMARKET_MARKET_API_DOMAIN, `/events/${id}`, options || {});
    const response = await fetchJson<PolymarketEventResponse>(url);
    return resolvePolymarketResponse(response);
}

export async function getPolymarketEvent({
    id,
    slug,
    ...options
}: Options & {
    id?: string;
    slug?: string;
}) {
    if (id) return getPolymarketEventById(id, options);
    if (slug) return getPolymarketEventBySlug(slug, options);

    throw new Error('Either id or slug must be provided');
}
