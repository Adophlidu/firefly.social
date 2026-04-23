import { EMPTY_LIST } from '@dimensiondev/constants';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import type { PredictionPlatform, SourceInURL } from '@/constants/enum.js';
import { formatPolymarketFromFirefly } from '@/helpers/formatPolymarketFromFirefly.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { BetsActivity, Response as FireflyResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

interface Options {
    platformFollowing?: SourceInURL | 'all';
    indicator?: PageIndicator;
    size?: number;
    platforms?: PredictionPlatform[];
}

export async function getFollowingPredictionList({
    platformFollowing = 'all',
    indicator,
    platforms,
    size = 20,
}: Options) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/timeline/bets');
    const response = await fireflySessionHolder.fetch<
        FireflyResponse<{
            result: BetsActivity[];
            cursor?: string;
        }>
    >(url, {
        method: 'POST',
        body: JSON.stringify({
            platformFollowing,
            size,
            platform: !platforms || platforms.length > 1 ? undefined : platforms[0],
            cursor: indicator?.id,
        }),
    });
    const data = resolveFireflyResponseData(response);

    return createPageable(
        data?.result.map(formatPolymarketFromFirefly) || EMPTY_LIST,
        createIndicator(indicator),
        data?.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
    );
}
