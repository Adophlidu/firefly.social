import urlcat from 'urlcat';

import { Source } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/index.js';
import { createPageTitleOG } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { getWalletProfileByAddressOrEns } from '@/providers/firefly/endpoints/getWalletProfileByAddressOrEns.js';

export async function createMetadataWalletProfile(pathname: string, addressOrEns: string) {
    const walletProfile = await getWalletProfileByAddressOrEns(addressOrEns, false);
    if (!walletProfile) return createSiteMetadata(pathname);

    const title = walletProfile.primary_ens
        ? createPageTitleOG(walletProfile.primary_ens)
        : createPageTitleOG(formatAddress(walletProfile.address, 4));
    const description = walletProfile.address;
    const images = [
        urlcat(SITE_URL, 'api/og/profile/:source/:id/image', {
            source: resolveSourceInUrl(Source.Wallet),
            id: addressOrEns,
        }),
    ];

    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            type: 'profile',
            url: urlcat(SITE_URL, getProfileUrl({ source: Source.Wallet, profileId: addressOrEns })),
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
