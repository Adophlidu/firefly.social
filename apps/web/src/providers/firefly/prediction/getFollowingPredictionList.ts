import { EMPTY_LIST } from '@dimensiondev/constants';
import type { Locale, PredictionPlatform, SourceInURL } from '@dimensiondev/enums';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { formatPolymarketFromFirefly } from '@/helpers/formatPolymarketFromFirefly.js';
import { resolvePolymarketLocale } from '@/helpers/prediction/resolvePolymarketLocale.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { BetsActivity, Response as FireflyResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

interface Options {
    platformFollowing?: SourceInURL | 'all';
    indicator?: PageIndicator;
    size?: number;
    locale?: Locale;
    platforms?: PredictionPlatform[];
}

export async function getFollowingPredictionList({
    platformFollowing = 'all',
    indicator,
    platforms,
    size = 20,
    locale,
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
            ...(locale ? { locale: resolvePolymarketLocale(locale) } : {}),
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
