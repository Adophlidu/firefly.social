import urlcat from 'urlcat';

import { type TokenTrendingData } from '@/components/TokenTrendingListItem.js';
import { formatTrendingToken } from '@/helpers/formatTrendingToken.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type TrendingTokensResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getTopSearchTokens({ indicator }: { indicator?: PageIndicator } = {}) {
    const page = !indicator?.id || indicator.id === '0' ? 1 : Number(indicator.id);
    // cspell: disable-next-line
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/token/topsearch', {
        page,
    });
    const response = await fireflySessionHolder.fetch<TrendingTokensResponse>(url);
    const data = resolveFireflyResponseData(response);

    const formattedData = data.map((item) => {
        return formatTrendingToken(item, 'h24');
    });

    const currentIndicator = createIndicator(indicator);
    const hasNextPage = false;
    const nextIndicator = hasNextPage ? createNextIndicator(indicator, `${page + 1}`, 20) : undefined;

    return createPageable<TokenTrendingData>(formattedData, currentIndicator, nextIndicator);
}
