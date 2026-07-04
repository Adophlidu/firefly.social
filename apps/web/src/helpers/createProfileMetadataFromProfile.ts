import { SITE_NAME } from '@dimensiondev/constants/static';
import type { ProfilePageSourceInURL } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import type { Metadata } from 'next';
import urlcat from 'urlcat';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function createProfileMetadataFromProfile(
    profile: Profile,
    sourceInUrl: ProfilePageSourceInURL,
    pathname: string,
): Metadata {
    const ogImageUrl = urlcat(SITE_URL, '/api/og/profile/:source/:handle/image', {
        source: sourceInUrl,
        handle: profile.handle,
    });
    const handle = profile.handle;
    const title = profile.displayName?.trim()
        ? `${profile.displayName} (@${handle}) on ${SITE_NAME}`
        : `@${handle} on ${SITE_NAME}`;
    const description = profile.bio?.trim() || `View @${handle}'s profile on ${SITE_NAME}.`;

    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            type: 'profile',
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
