import { PredictionPlatform } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';
import type { Metadata } from 'next';
import { cache } from 'react';

import { compactEventForPageTransfer } from '@/helpers/compactEventForPageTransfer.js';
import { createPredictionEventMetadataFromEvent } from '@/helpers/createPredictionEventMetadataFromEvent.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveLocale } from '@/helpers/resolveLocale.js';
import { createPredictionEventMetadata } from '@/providers/firefly/metadata/createPredictionEventMetadata.js';
import { getEventDetail } from '@/providers/firefly/prediction/getEventDetail.js';

export const getPolymarketEventPageData = cache(async (id: string, isMutil: boolean, locale: string) => {
    const resolvedLocale = resolveLocale(locale);
    const event = await runInSafeAsync(() =>
        getEventDetail(PredictionPlatform.Polymarket, { id, isMutil, locale: resolvedLocale }),
    );

    if (!event) return { event: null };

    return { event: compactEventForPageTransfer(event) };
});

export async function getPolymarketEventPageMetadata({
    id,
    isMutil,
    locale,
    platform,
    pathname,
    type,
}: {
    id: string;
    isMutil: boolean;
    locale: string;
    platform: PredictionPlatform;
    pathname: string;
    type?: string;
}): Promise<Metadata> {
    const pageData = await runInSafeAsync(() => getPolymarketEventPageData(id, isMutil, locale));
    if (pageData?.event) {
        return createPredictionEventMetadataFromEvent(pageData.event, pathname, platform, id, type);
    }

    try {
        return await createPredictionEventMetadata(id, platform, pathname, type);
    } catch {
        return createSiteMetadata(pathname);
    }
}
