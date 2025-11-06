import urlcat from 'urlcat';

import { SourceInURL } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { PolymarketActivityTimeline } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getProfilePolymarketTimeline(
    address: string | string[],
    platformFollowing: SourceInURL | 'all' = 'all',
    indicator?: PageIndicator,
) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/timeline/polymarket');

    const response = await fireflySessionHolder.fetch<PolymarketActivityTimeline>(url, {
        method: 'POST',
        body: JSON.stringify({
            platformFollowing,
            walletAddresses: Array.isArray(address) ? address : [address],
            size: 25,
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
