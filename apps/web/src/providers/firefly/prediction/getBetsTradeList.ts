import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import type { PredictionPlatform } from '@/constants/enum.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { BetsActivity, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

interface Options {
    platform: PredictionPlatform;
    isFollowing?: boolean;
    size?: number;
    indicator?: PageIndicator;
    conditionIds?: string[];
    tokenIds?: string[];
    startTime?: number;
    endTime?: number;
}

export async function getBetsTradeList({ indicator, size = 20, ...rest }: Options) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/timeline/bets/market');
    const response = await fireflySessionHolder.fetch<
        Response<{
            result: BetsActivity[];
            cursor?: string;
        }>
    >(url, {
        method: 'POST',
        body: JSON.stringify({
            ...rest,
            size,
            cursor: indicator?.id,
        }),
    });
    const data = resolveFireflyResponseData(response);
    return createPageable(
        data.result,
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
    );
}
