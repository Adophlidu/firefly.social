import urlcat from 'urlcat';

import type { TimeRangeFilter } from '@/constants/enum.js';
import { formatTrendingToken } from '@/helpers/formatTrendingToken.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveTimeRangeSortString } from '@/helpers/resolveTimeRangeName.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { TrendingTokensResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getTrendingTokens({ network, sort }: { network?: string; sort?: TimeRangeFilter }) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/token/trending', {
        page: 1,
        sort: sort ? resolveTimeRangeSortString(sort) : undefined,
        network,
    });
    const response = await fireflySessionHolder.fetch<TrendingTokensResponse>(url);
    const data = resolveFireflyResponseData(response);

    return data.map((item) => {
        return formatTrendingToken(item, sort);
    });
}
