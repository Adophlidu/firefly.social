import type { PredictionPlatform } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import type { Metadata } from '@/compat/nextMetadata.js';
import urlcat from 'urlcat';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

export function createPredictionEventMetadataFromEvent(
    event: BetsEventDataForUI,
    pathname: string,
    platform: PredictionPlatform,
    id: string,
    type?: string,
): Metadata {
    const ogImageUrl = urlcat(SITE_URL, '/api/og/prediction/event/:platform/:id/image', { platform, id, type });
    const title = event.title ? `Track ${event.title} predictions on Firefly` : 'View Prediction Event on Firefly';
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
