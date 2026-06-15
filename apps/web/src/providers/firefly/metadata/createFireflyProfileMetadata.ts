import { SITE_URL } from '@dimensiondev/envs/web';
import { metadataWorker } from '@dimensiondev/workers-client';
import type { Metadata } from 'next';
import urlcat from 'urlcat';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { settings } from '@/settings/index.js';

export async function createFireflyProfileMetadata(source: string, pathname: string): Promise<Metadata> {
    const ogImageUrl = urlcat(SITE_URL, '/api/og/profile/firefly/:source/image', { source });

    try {
        const res = await metadataWorker['metadata-v2']['firefly-profile'].$get(
            { query: { source, pathname } },
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
