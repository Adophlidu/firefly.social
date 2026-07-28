import type { ProfilePageSourceInURL } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import urlcat from 'urlcat';

import type { Metadata } from '@/compat/nextMetadata.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isSocialSourceInUrl } from '@/helpers/isSource.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { createProfileMetadataFromProfile } from '@/providers/firefly/metadata/createProfileMetadataFromProfile.js';
import { getSocialProfileByHandlePageData } from '@/providers/firefly/metadata/getSocialProfilePageData.js';

export async function getSocialProfilePageMetadata(
    source: ProfilePageSourceInURL,
    handle: string,
    pathname: string,
): Promise<Metadata> {
    const ogImageUrl = urlcat(SITE_URL, '/api/og/profile/:source/:handle/image', { source, handle });

    try {
        if (!isSocialSourceInUrl(source)) {
            return createSiteMetadata(pathname, {
                openGraph: { images: [ogImageUrl] },
                twitter: { images: [ogImageUrl] },
            });
        }

        const socialSource = narrowToSocialSource(resolveSocialSource(source));
        const profile = await getSocialProfileByHandlePageData(socialSource, handle);
        if (!profile) {
            return createSiteMetadata(pathname, {
                openGraph: { images: [ogImageUrl] },
                twitter: { images: [ogImageUrl] },
            });
        }

        return createProfileMetadataFromProfile(profile, source, pathname);
    } catch {
        return createSiteMetadata(pathname, {
            openGraph: { images: [ogImageUrl] },
            twitter: { images: [ogImageUrl] },
        });
    }
}
