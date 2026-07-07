import type { PredictionPlatform } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import { runInSafeAsync } from '@dimensiondev/utils';
import type { Metadata } from 'next';
import urlcat from 'urlcat';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveLocale } from '@/helpers/resolveLocale.js';
import { createPredictionEventMetadataFromEvent } from '@/providers/firefly/metadata/createPredictionEventMetadataFromEvent.js';
import { getEventDetail } from '@/providers/firefly/prediction/getEventDetail.js';

export async function getPredictionEventPageMetadata({
    id,
    isMutil,
    locale,
    platform,
    pathname,
    type,
}: {
    id: string;
    isMutil: boolean;
    locale?: string;
    platform: PredictionPlatform;
    pathname: string;
    type?: string;
}): Promise<Metadata> {
    const resolvedLocale = locale ? resolveLocale(locale) : undefined;
    const event = await runInSafeAsync(() => getEventDetail(platform, { id, isMutil, locale: resolvedLocale }));

    if (event) {
        return createPredictionEventMetadataFromEvent(event, pathname, platform, id, type);
    }

    const ogImageUrl = urlcat(SITE_URL, '/api/og/prediction/event/:platform/:id/image', { platform, id, type });
    const title = 'View Prediction Event on Firefly';
    const description = 'Follow, analyze and join prediction markets in real time on Firefly.';

    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            type: 'website',
            url: urlcat(SITE_URL, pathname),
            title,
            description,
            images: [ogImageUrl],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImageUrl],
        },
    });
}
