import type { ProfilePageSourceInURL, SocialSource } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import type { Metadata } from 'next';
import { cache } from 'react';
import urlcat from 'urlcat';

import { compactProfileForPageTransfer } from '@/helpers/compactProfileForPageTransfer.js';
import { createProfileMetadataFromProfile } from '@/helpers/createProfileMetadataFromProfile.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isSocialSourceInUrl } from '@/helpers/isSource.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export const getSocialProfileByHandlePageData = cache(
    async (source: SocialSource, handle: string): Promise<Profile | null> => {
        const profile = await resolveSocialMediaProvider(source).getProfileByHandle(handle, true);
        return compactProfileForPageTransfer(profile);
    },
);

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
