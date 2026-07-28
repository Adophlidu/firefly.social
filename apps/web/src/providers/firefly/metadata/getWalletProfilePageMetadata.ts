import { SITE_URL } from '@dimensiondev/envs/web';
import urlcat from 'urlcat';

import type { Metadata } from '@/compat/nextMetadata.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { createWalletProfileMetadataFromProfile } from '@/providers/firefly/metadata/createWalletProfileMetadataFromProfile.js';
import { getWalletProfilePageData } from '@/providers/firefly/metadata/getWalletProfilePageData.js';

export async function getWalletProfilePageMetadata(addressOrEns: string, pathname: string): Promise<Metadata> {
    const ogImageUrl = urlcat(SITE_URL, '/api/og/profile/wallet/:addressOrEns/image', { addressOrEns });
    const walletProfile = await getWalletProfilePageData(addressOrEns);
    if (!walletProfile) {
        return createSiteMetadata(pathname, {
            openGraph: { images: [ogImageUrl] },
            twitter: { images: [ogImageUrl] },
        });
    }

    return createWalletProfileMetadataFromProfile(walletProfile, addressOrEns, pathname);
}
