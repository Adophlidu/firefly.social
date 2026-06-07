import { resolveSiteUrl } from '@dimensiondev/workers-shared/helpers/resolveSiteUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';

import { createSiteMetadata } from '@/metadata/src/helpers/createSiteMetadata.js';

export function createSparksDefaultMetadata(pathname: string, c: Context) {
    const title = 'Are you the next Genesis Sparks✨ on Firefly?';
    const description =
        'Unlock Genesis Sparks status to enjoy faster points, premium invite rewards, and a guaranteed airdrop.';
    const ogImageUrl = 'https://media.firefly.land/og/genesis_sparks.png';

    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            title,
            description,
            url: urlcat(resolveSiteUrl(c), pathname),
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
