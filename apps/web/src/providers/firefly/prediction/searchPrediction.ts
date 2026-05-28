import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { PolymarketEventListData, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export interface PredictionSearchTag {
    id: string;
    label: string;
    slug?: string;
    event_count?: number;
    forceHide?: boolean;
}

interface GammaSearchResponse {
    events?: PolymarketEventListData[];
    tags?: PredictionSearchTag[];
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
    eventsStatus?: 'active' | 'resolved' | 'archived';
    searchTags?: boolean;
}

export async function searchPrediction({
    keyword,
    indicator,
    limit = 20,
    sort = 'volume_24hr',
    eventsStatus,
    searchTags = true,
}: SearchBetsOptions): Promise<Pageable<PolymarketEventListData, PageIndicator> & { tags: PredictionSearchTag[] }> {
    const page = indicator?.id ? Number.parseInt(indicator.id, 10) : 1;

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
    const events = (data?.events || []).filter((event) => {
        if (eventsStatus === undefined) return true;
        if (eventsStatus === 'active')
            return event.markets.some((market) => market.enableOrderBook !== false && !market.closed);
        if (eventsStatus === 'resolved')
            return event.markets.every((market) => market.enableOrderBook === false || market.closed);
        if (eventsStatus === 'archived') return event.archived;
        return true;
    });
    const tags = data?.tags || [];
    const currentIndicator = createIndicator(indicator);
    const hasMore = data?.pagination.hasMore ?? false;
    const nextIndicator = hasMore ? createNextIndicator(indicator, `${page + 1}`) : undefined;

    return {
        ...createPageable<PolymarketEventListData>(events, currentIndicator, nextIndicator),
        tags,
    };
}
