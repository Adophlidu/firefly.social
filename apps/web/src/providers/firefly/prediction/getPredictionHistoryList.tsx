import type { PredictionPlatform } from '@dimensiondev/enums';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { BetsPosition, Response as FireflyResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

interface Options {
    wallet: string;
    platform: PredictionPlatform;
    is_proxy?: boolean;
    is_history?: boolean;
    is_mutil?: number;
    topic_id?: number;
    limit?: number;
    indicator?: PageIndicator;
}

export async function getPredictionHistoryList({ indicator, ...rest }: Options) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/bets/position/current');
    const response = await fireflySessionHolder.fetch<
        FireflyResponse<{
            result: BetsPosition[];
            cursor?: string;
        }>
    >(url, {
        method: 'POST',
        body: JSON.stringify({
            ...rest,
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
