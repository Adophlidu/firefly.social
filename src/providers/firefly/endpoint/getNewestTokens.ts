import urlcat from 'urlcat';

import { formatTrendingToken } from '@/helpers/formatTrendingToken.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { TrendingTokensResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getNewestTokens({ network }: { network?: string }) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/token/newest', {
        network,
    });
    const response = await fireflySessionHolder.fetch<TrendingTokensResponse>(url);
    const data = resolveFireflyResponseData(response);
    return data.map((item) => {
        return formatTrendingToken(item, 'h1');
    });
}
