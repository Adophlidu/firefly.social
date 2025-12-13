import type { Metadata } from 'next';
import urlcat from 'urlcat';

import { FIREFLY_S3_URL, SITE_URL_OFFICIAL } from '@/constants/static.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export function createSparksMetadata(): Metadata {
    const title = 'Are you the next Genesis Sparks✨ on Firefly?';
    const description =
        'Unlock Genesis Sparks status to enjoy faster points, premium invite rewards, and a guaranteed airdrop.';
    const url = urlcat(SITE_URL_OFFICIAL, '/sparks');
    const ogImageUrl = urlcat(FIREFLY_S3_URL, '/og/genesis_sparks.png');

    return createSiteMetadata('/sparks', {
        title,
        description,
        openGraph: {
            title,
            description,
            url,
            images: [ogImageUrl],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            creator: '@thefireflyapp',
            images: [ogImageUrl],
        },
    });
}
