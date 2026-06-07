import { resolveSiteUrl } from '@dimensiondev/workers-shared/helpers/resolveSiteUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';

import { createSiteMetadata } from '@/metadata/src/helpers/createSiteMetadata.js';
import type { SparksProfile } from '@/metadata/src/sparks-account/types.js';

export function createSparksAccountMetadata(profile: SparksProfile, pathname: string, c: Context) {
    const title = 'I’m officially a Genesis Sparks✨ on Firefly!';
    const description =
        'Unlock Genesis Sparks status to enjoy faster points, premium invite rewards, and a guaranteed airdrop.';
    const ogImageUrl = urlcat(resolveSiteUrl(c), `/api/og/sparks_account/${profile.uid}/image`);

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
