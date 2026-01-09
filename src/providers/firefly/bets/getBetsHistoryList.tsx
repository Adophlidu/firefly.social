import urlcat from 'urlcat';

import { type BetsPlatform } from '@/constants/enum.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type BetsPosition, type Response as FireflyResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

interface Options {
    wallet: string;
    platform: BetsPlatform;
    is_proxy?: boolean;
    is_history?: boolean;
    is_mutil?: number;
    topic_id?: number;
    limit?: number;
    indicator?: PageIndicator;
}

export async function getBetsHistoryList({ indicator, ...rest }: Options) {
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
