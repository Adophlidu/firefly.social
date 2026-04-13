import { EMPTY_LIST } from '@dimensiondev/constants';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import type { PredictionPlatform } from '@/constants/enum.js';
import { formatPolymarketFromFirefly } from '@/helpers/formatPolymarketFromFirefly.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { BetsActivity, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

interface Options {
    walletAddresses: string[];
    platforms?: PredictionPlatform[];
    indicator?: PageIndicator;
    size?: number;
}

export async function getPredictionTimelineByAddress({ walletAddresses, platforms, indicator, size = 20 }: Options) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/timeline/bets');
    const response = await fireflySessionHolder.fetch<
        Response<{
            result: BetsActivity[];
            cursor?: string;
        }>
    >(url, {
        method: 'POST',
        body: JSON.stringify({
            walletAddresses,
            platform: platforms?.join(',') || undefined,
            size,
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
