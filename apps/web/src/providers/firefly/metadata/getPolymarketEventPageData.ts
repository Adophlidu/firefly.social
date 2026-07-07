import { PredictionPlatform } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';
import { cache } from 'react';

import { resolveLocale } from '@/helpers/resolveLocale.js';
import { getEventDetail } from '@/providers/firefly/prediction/getEventDetail.js';

export const getPolymarketEventPageData = cache(async (id: string, isMutil: boolean, locale: string) => {
    const resolvedLocale = resolveLocale(locale);
    const event = await runInSafeAsync(() =>
        getEventDetail(PredictionPlatform.Polymarket, { id, isMutil, locale: resolvedLocale }),
    );

    if (!event) return { event: null };

    return { event };
});
