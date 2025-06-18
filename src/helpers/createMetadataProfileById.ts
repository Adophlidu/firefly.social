import urlcat from 'urlcat';

import { type ProfilePageSource, Source } from '@/constants/enum.js';
import { SITE_DESCRIPTION, SITE_URL } from '@/constants/index.js';
import { createMetadataWalletProfile } from '@/helpers/createMetadataWalletProfile.js';
import { createPageTitleOG } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';

export async function createMetadataProfileById(source: ProfilePageSource, profileId: string, forceHandle = false) {
    if (source === Source.Wallet || source === Source.WalletMix) return createMetadataWalletProfile(profileId);
    const profile = await runInSafeAsync(() => {
        const provider = resolveSocialMediaProvider(source);
        return forceHandle ? provider.getProfileByHandle(profileId) : provider.getProfileByIdOrHandle(profileId);
    });

    if (!profile) return createSiteMetadata();

    const images = [
        {
            url: urlcat(SITE_URL, 'api/og/profile/:source/:id/image', {
                source: resolveSourceInUrl(source),
                id: profileId,
            }),
        },
    ];

    const title = createPageTitleOG(`@${profile.handle}`);
    const description = profile.bio ?? SITE_DESCRIPTION;

    return createSiteMetadata({
        title,
        description,
        openGraph: {
            type: 'profile',
            url: urlcat(SITE_URL, getProfileUrl(profile)),
            title,
            description,
            images,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        },
    });
}
