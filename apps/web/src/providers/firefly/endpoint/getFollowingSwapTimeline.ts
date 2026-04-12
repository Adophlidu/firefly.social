import { EMPTY_LIST } from '@dimensiondev/constants';
import urlcat from 'urlcat';

import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { SwapActivityTimeline } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getFollowingSwapTimeline(
    chains: number[], // array of chain ids
    tokenAddress?: string,
    indicator?: PageIndicator,
    size = 25,
) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/timeline/swap');
    const response = await fireflySessionHolder.fetch<SwapActivityTimeline>(url, {
        method: 'POST',
        body: JSON.stringify({
            platformFollowing: 'all',
            chains: chains.length ? chains.join(',') : undefined,
            tokenAddress,
            size,
            cursor: indicator?.id,
        }),
    });

    const data = resolveFireflyResponseData(response);

    return createPageable(
        data?.result || EMPTY_LIST,
        createIndicator(indicator),
        data?.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
    );
}
