import type { Metadata } from 'next';
import urlcat from 'urlcat';

import { SITE_URL } from '@/constants/static.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { fetchMetadataApi } from '@/providers/firefly/metadata/fetchMetadataApi.js';

export async function createFireflyProfileMetadata(source: string, pathname: string): Promise<Metadata> {
    const ogImageUrl = urlcat(SITE_URL, '/api/og/profile/firefly/:source/image', { source });

    try {
        const response = await fetchMetadataApi(
            urlcat('/metadata/firefly-profile', {
                source,
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
