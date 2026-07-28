import type { PredictionPlatform } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import type { Metadata } from '@/compat/nextMetadata.js';
import urlcat from 'urlcat';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export function createPredictionProfileMetadataFromProfile({
    displayName,
    pathname,
    platform,
    address,
}: {
    displayName: string;
    pathname: string;
    platform: PredictionPlatform;
    address: string;
}): Metadata {
    const title = `View ${displayName} on Firefly`;
    const description = 'Follow, analyze and join prediction markets in real time on Firefly.';
    const ogImageUrl = urlcat(SITE_URL, '/api/og/prediction/profile/:platform/:address/image', { platform, address });

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
