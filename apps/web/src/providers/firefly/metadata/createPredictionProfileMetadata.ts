import type { PredictionPlatform } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import type { Metadata } from 'next';
import urlcat from 'urlcat';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { metadataWorker } from '@/providers/firefly/worker/clients.js';
import { settings } from '@/settings/index.js';

export async function createPredictionProfileMetadata(
    address: string,
    platform: PredictionPlatform,
    pathname: string,
): Promise<Metadata> {
    const ogImageUrl = urlcat(SITE_URL, '/api/og/prediction/profile/:platform/:address/image', { platform, address });

    try {
        const res = await metadataWorker['metadata-v2']['prediction-profile'].$get(
            { query: { address, platform, pathname } },
            { headers: { 'X-DEVELOPMENT-API': settings.dev ? 'true' : 'false' } },
        );
        if (!res.ok)
            return createSiteMetadata(pathname, {
                openGraph: { images: [ogImageUrl] },
                twitter: { images: [ogImageUrl] },
            });
        const json = await res.json();
        return resolveResponseData(json);
    } catch (error) {
        return createSiteMetadata(pathname, {
            openGraph: { images: [ogImageUrl] },
            twitter: { images: [ogImageUrl] },
        });
    }
}
