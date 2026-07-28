import { SITE_DESCRIPTION } from '@dimensiondev/constants/static';
import { Source } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import urlcat from 'urlcat';

import type { Metadata } from '@/compat/nextMetadata.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import type { FireflyAccountProfile } from '@/providers/types/Firefly.js';

export function createFireflyProfileMetadataFromAccount(
    account: FireflyAccountProfile,
    uid: string,
    pathname: string,
): Metadata {
    const title = `View ${account.displayName || 'Firefly User'} on Firefly`;
    const description = SITE_DESCRIPTION;
    const ogImageUrl = urlcat(SITE_URL, '/api/og/profile/:source/:uid/image', {
        source: resolveSourceInUrl(Source.Firefly),
        uid,
    });

    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            type: 'profile',
            url: urlcat(SITE_URL, `/profile/${uid}`),
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
