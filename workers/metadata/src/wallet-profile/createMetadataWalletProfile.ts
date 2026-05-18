import { Source } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/workers-shared/constants/metadata.js';
import { createPageTitleOG } from '@dimensiondev/workers-shared/helpers/createPageTitleOG.js';
import { createSiteMetadata } from '@dimensiondev/workers-shared/helpers/createSiteMetadata.js';
import { fetchFireflyEndpointRpc } from '@dimensiondev/workers-shared/helpers/fetchFireflyEndpointRpc.js';
import { formatAddress } from '@dimensiondev/workers-shared/helpers/formatAddress.js';
import { resolveSourceInUrl } from '@dimensiondev/workers-shared/helpers/resolveSource.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';

import type { WalletProfile } from '@/metadata/src/firefly-profile/types.js';
import { getProfileUrl } from '@/metadata/src/profile/getProfileUrl.js';
import { getEnsNameFromWalletProfile } from '@/metadata/src/wallet-profile/getEnsNameFromWalletProfile.js';

type Metadata = Record<string, unknown>;

export async function createMetadataWalletProfile(
    addressOrEns: string,
    pathname: string,
    context: Context,
): Promise<Metadata> {
    const walletProfile = await fetchFireflyEndpointRpc<WalletProfile>(
        'getWalletProfileByAddressOrEns',
        { addressOrEns },
        context,
    );
    if (!walletProfile) return createSiteMetadata(pathname);

    const title = createPageTitleOG(
        getEnsNameFromWalletProfile(walletProfile) || formatAddress(walletProfile.address, 4),
    );
    const description = "Track this wallet's swaps, trades and social activity. Follow their journey on Firefly.";
    const images = [urlcat(SITE_URL, `/api/og/profile/${resolveSourceInUrl(Source.Wallet)}/${addressOrEns}/image`)];

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
