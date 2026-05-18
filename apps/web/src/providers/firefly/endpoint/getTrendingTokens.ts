import type { TimeRangeFilter } from '@dimensiondev/enums';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { formatTrendingToken } from '@/helpers/formatTrendingToken.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveTimeRangeSortString } from '@/helpers/resolveTimeRangeName.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { TrendingTokensResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getTrendingTokens({
    network,
    sort,
    indicator,
}: {
    network?: string;
    sort?: TimeRangeFilter;
    indicator?: PageIndicator;
}) {
    const page = !indicator?.id || indicator.id === '0' ? 1 : Number(indicator.id);
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/token/trending', {
        page,
        sort: sort ? resolveTimeRangeSortString(sort) : undefined,
        network,
    });
    const response = await fireflySessionHolder.fetch<TrendingTokensResponse>(url);
    const data = resolveFireflyResponseData(response);

    const formattedData = data.map((item) => {
        return formatTrendingToken(item, sort);
    });

    const currentIndicator = createIndicator(indicator);
    const hasNextPage = !!data.length;
    const nextIndicator = hasNextPage ? createNextIndicator(indicator, `${page + 1}`, 20) : undefined;

    return createPageable(formattedData, currentIndicator, nextIndicator);
}
