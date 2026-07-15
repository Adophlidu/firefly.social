import { EMPTY_LIST } from '@dimensiondev/constants';
import type { Locale, PredictionPlatform } from '@dimensiondev/enums';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { formatPolymarketFromFirefly } from '@/helpers/formatPolymarketFromFirefly.js';
import { resolvePolymarketLocale } from '@/helpers/prediction/resolvePolymarketLocale.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { BetsActivity, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

interface Options {
    walletAddresses: string[];
    platforms?: PredictionPlatform[];
    indicator?: PageIndicator;
    size?: number;
    locale?: Locale;
}

export async function getPredictionTimelineByAddress({
    walletAddresses,
    platforms,
    indicator,
    size = 20,
    locale,
}: Options) {
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
            ...(locale ? { locale: resolvePolymarketLocale(locale) } : {}),
        }),
    });

    const data = resolveFireflyResponseData(response);
    return createPageable(
        data?.result.map(formatPolymarketFromFirefly) || EMPTY_LIST,
        createIndicator(indicator),
        data?.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
    );
}
