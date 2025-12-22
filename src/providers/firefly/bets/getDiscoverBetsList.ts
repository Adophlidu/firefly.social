import urlcat from 'urlcat';

import type { BetsPlatform } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { formatPolymarketFromFirefly } from '@/helpers/formatPolymarketFromFirefly.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { BetsActivity, Response as FireflyResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

interface Options {
    size?: number;
    cursor?: string;
    platform?: BetsPlatform[];
    indicator?: PageIndicator;
}

export async function getDiscoverBetsList(options: Options) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/discover/bets', {
        platform: options.platform?.join(',') || undefined,
        size: options.size || 20,
        cursor: options.indicator?.id,
    });
    const response = await fireflySessionHolder.fetch<
        FireflyResponse<{
            result: BetsActivity[];
            cursor?: string;
        }>
    >(url);

    const data = resolveFireflyResponseData(response);
    return createPageable(
        data.result.map(formatPolymarketFromFirefly) || EMPTY_LIST,
        createIndicator(options.indicator),
        data?.cursor ? createNextIndicator(options.indicator, data.cursor) : undefined,
    );
}
