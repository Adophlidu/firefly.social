import type { Metadata } from 'next';
import urlcat from 'urlcat';

import type { PredictionPlatform } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/static.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { fetchMetadataApi } from '@/providers/firefly/metadata/fetchMetadataApi.js';

export async function createPredictionProfileMetadata(
    address: string,
    platform: PredictionPlatform,
    pathname: string,
): Promise<Metadata> {
    const ogImageUrl = urlcat(SITE_URL, '/api/og/prediction/profile/:platform/:address/image', { platform, address });

    try {
        const response = await fetchMetadataApi(
            urlcat('/metadata-v2/prediction-profile', {
                address,
                platform,
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
