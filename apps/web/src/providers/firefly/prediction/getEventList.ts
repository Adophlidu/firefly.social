import { EMPTY_LIST } from '@dimensiondev/constants';
import urlcat from 'urlcat';

import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type PolymarketEventListData, type Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

interface Options {
    slug?: string;
    subSlug?: string;
    indicator?: PageIndicator;
}

export async function getEventList({ slug, subSlug, indicator }: Options = {}) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/polymarket/event/list');
    const response = await fireflySessionHolder.fetch<
        Response<{ data: PolymarketEventListData[] | null; pagination: { totalResults: number; hasMore: boolean } }>
    >(url, {
        method: 'POST',
        body: JSON.stringify({
            limit: 20,
            active: true,
            archived: false,
            closed: false,
            order: slug === 'new' ? 'startDate' : 'volume24hr',
            ascending: false,
            offset: indicator?.id ? +indicator.id : 0,
            tag_slug: slug !== 'trending' && slug !== 'new' ? slug : undefined,
            children_tag_slug: subSlug,
        }),
    });
    const data = resolveFireflyResponseData(response);
    if (!data?.data) {
        return createPageable<PolymarketEventListData>(EMPTY_LIST, createIndicator(indicator), undefined);
    }

    const currentIndicator = createIndicator(indicator);
    const hasNextPage = data.pagination.hasMore;
    const currentOffset = indicator?.id ? +indicator.id : 0;
    const nextIndicator = hasNextPage ? createNextIndicator(indicator, `${currentOffset + 20}`, 20) : undefined;

    return createPageable<PolymarketEventListData>(data.data, currentIndicator, nextIndicator);
}
