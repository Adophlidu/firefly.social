import { SITE_URL } from '@dimensiondev/envs/web';
import { runInSafeAsync } from '@dimensiondev/utils';
import type { Metadata } from 'next';
import { cache } from 'react';
import urlcat from 'urlcat';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { getWalletProfileByAddressOrEns } from '@/providers/firefly/endpoint/getWalletProfileByAddressOrEns.js';
import { createWalletProfileMetadataFromProfile } from '@/providers/firefly/metadata/createWalletProfileMetadataFromProfile.js';
import type { WalletProfile } from '@/providers/types/Firefly.js';

export const getWalletProfilePageData = cache(async (addressOrEns: string): Promise<WalletProfile | null> => {
    const walletProfile = await runInSafeAsync(() => getWalletProfileByAddressOrEns(addressOrEns, false));
    return walletProfile ?? null;
});

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
