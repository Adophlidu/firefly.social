import { type Metadata } from 'next';
import urlcat from 'urlcat';

import { type PredictionPlatform } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/static.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { fetchMetadataApi } from '@/providers/firefly/metadata/fetchMetadataApi.js';

export async function createPredictionEventMetadata(
    id: string,
    platform: PredictionPlatform,
    pathname: string,
    type?: 'multi' | string,
): Promise<Metadata> {
    const ogImageUrl = urlcat(SITE_URL, '/api/og/prediction/event/:platform/:id/image', { platform, id });

    try {
        const response = await fetchMetadataApi(
            urlcat('/metadata/prediction-event', {
                id,
                platform,
                type,
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
