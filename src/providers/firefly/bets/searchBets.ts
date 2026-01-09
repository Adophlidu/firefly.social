import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { PolymarketEventListData, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

interface GammaSearchResponse {
    events?: PolymarketEventListData[];
    pagination: {
        totalResults: number;
        hasMore: boolean;
    };
}

export interface SearchBetsOptions {
    keyword: string;
    indicator?: PageIndicator;
    limit?: number;
    sort?: 'volume_24hr' | 'startDate' | 'endDate';
    eventsStatus?: 'active' | 'closed' | 'archived';
    searchTags?: boolean;
}

export async function searchBets({
    keyword,
    indicator,
    limit = 20,
    sort = 'volume_24hr',
    eventsStatus = 'active',
    searchTags = true,
}: SearchBetsOptions): Promise<Pageable<PolymarketEventListData, PageIndicator>> {
    const page = indicator?.id ? parseInt(indicator.id, 10) : 1;

    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/polymarket/public-search', {
        q: keyword,
        limit_per_type: limit,
        type: 'events',
        page,
        sort,
        events_status: eventsStatus,
        search_tags: searchTags,
    });

    const response = await fetchJson<Response<GammaSearchResponse>>(url);

    const data = resolveFireflyResponseData(response);
    const events = data?.events || [];
    const currentIndicator = createIndicator(indicator);
    const hasMore = data?.pagination.hasMore ?? false;
    const nextIndicator = hasMore ? createNextIndicator(indicator, `${page + 1}`) : undefined;

    return createPageable<PolymarketEventListData>(events, currentIndicator, nextIndicator);
}
