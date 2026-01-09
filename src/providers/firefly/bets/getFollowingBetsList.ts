import urlcat from 'urlcat';

import { type BetsPlatform, type SourceInURL } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { formatPolymarketFromFirefly } from '@/helpers/formatPolymarketFromFirefly.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type BetsActivity, type Response as FireflyResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

interface Options {
    platformFollowing?: SourceInURL | 'all';
    indicator?: PageIndicator;
    size?: number;
    platforms?: BetsPlatform[];
}

export async function getFollowingBetsList({ platformFollowing = 'all', indicator, platforms, size = 20 }: Options) {
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
            platform: platforms?.join(',') || undefined,
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
