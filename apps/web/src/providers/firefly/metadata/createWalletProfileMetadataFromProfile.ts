import { Source, SourceInURL } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import { formatAddress } from '@dimensiondev/web3/utils';
import urlcat from 'urlcat';

import type { Metadata } from '@/compat/nextMetadata.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { getEnsNameFromWalletProfile } from '@/helpers/getEnsNameFromWalletProfile.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import type { WalletProfile } from '@/providers/types/Firefly.js';

export function createWalletProfileMetadataFromProfile(
    walletProfile: WalletProfile,
    addressOrEns: string,
    pathname: string,
): Metadata {
    const displayName = getEnsNameFromWalletProfile(walletProfile) || formatAddress(walletProfile.address, 4);
    const title = `View ${displayName} on Firefly`;
    const description = "Track this wallet's swaps, trades and social activity. Follow their journey on Firefly.";
    const images = [urlcat(SITE_URL, `/api/og/profile/${SourceInURL.Wallet}/${addressOrEns}/image`)];

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
