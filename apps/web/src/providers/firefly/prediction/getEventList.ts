import { EMPTY_LIST } from '@dimensiondev/constants';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { PolymarketEventListData, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

interface Options {
    slug?: string;
    subSlug?: string;
    indicator?: PageIndicator;
}

export async function getEventList({ slug, subSlug, indicator }: Options = {}) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/polymarket/event/list', {
        limit: 20,
        active: true,
        archived: false,
        closed: false,
        order: slug === 'new' ? 'startDate' : 'volume24hr',
        ascending: false,
        cursor: indicator?.id || '',
        tag_slug: slug !== 'trending' && slug !== 'new' ? slug : undefined,
        children_tag_slug: subSlug,
    });
    const response =
        await fetchJson<Response<{ events: PolymarketEventListData[] | null; cursor: string | null }>>(url);
    const data = resolveFireflyResponseData(response);
    if (!data?.events) {
        return createPageable<PolymarketEventListData>(EMPTY_LIST, createIndicator(indicator), undefined);
    }

    const currentIndicator = createIndicator(indicator);
    const nextIndicator = data.cursor ? createNextIndicator(indicator, data.cursor, 20) : undefined;

    return createPageable<PolymarketEventListData>(data.events, currentIndicator, nextIndicator);
}
