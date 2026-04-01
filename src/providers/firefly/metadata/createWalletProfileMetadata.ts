import { type Metadata } from 'next';
import urlcat from 'urlcat';

import { SITE_URL } from '@/constants/static.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { fetchMetadataApi } from '@/providers/firefly/metadata/fetchMetadataApi.js';

export async function createWalletProfileMetadata(addressOrEns: string, pathname: string): Promise<Metadata> {
    const ogImageUrl = urlcat(SITE_URL, '/api/og/profile/wallet/:addressOrEns/image', { addressOrEns });

    try {
        const response = await fetchMetadataApi(
            urlcat('/metadata/wallet-profile', {
                addressOrEns,
                pathname,
            }),
        );
        const metadata = resolveResponseData(response);
        return metadata;
    } catch (error) {
        return createSiteMetadata(pathname, {
            openGraph: { images: [ogImageUrl] },
            twitter: { images: [ogImageUrl] },
        });
    }
}
