import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import type { TimeRangeFilter } from '@/constants/enum.js';
import { formatTrendingToken } from '@/helpers/formatTrendingToken.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveTimeRangeSortString } from '@/helpers/resolveTimeRangeName.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { TrendingTokensResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getStockTokens({ sort, indicator }: { sort?: TimeRangeFilter; indicator?: PageIndicator }) {
    const page = !indicator?.id || indicator.id === '0' ? 1 : Number(indicator.id);
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/token/stocks', {
        page,
        sort: sort ? resolveTimeRangeSortString(sort) : undefined,
    });
    const response = await fireflySessionHolder.fetch<TrendingTokensResponse>(url);
    const data = resolveFireflyResponseData(response);

    const formattedData = data.map((item) => {
        return formatTrendingToken(item, sort);
    });

    const currentIndicator = createIndicator(indicator);
    const hasNextPage = false;
    const nextIndicator = hasNextPage ? createNextIndicator(indicator, `${page + 1}`, 20) : undefined;

    return createPageable(formattedData, currentIndicator, nextIndicator);
}
