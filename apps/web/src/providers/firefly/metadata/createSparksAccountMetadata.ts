import type { Metadata } from 'next';
import urlcat from 'urlcat';

import { SITE_URL } from '@/constants/static.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { fetchMetadataApi } from '@/providers/firefly/metadata/fetchMetadataApi.js';

export async function createSparksAccountMetadata(accountId: string, pathname: string): Promise<Metadata> {
    const ogImageUrl = urlcat(SITE_URL, '/api/og/sparks_account/:accountId/image', { accountId });

    try {
        const response = await fetchMetadataApi(
            urlcat('/metadata/sparks-account', {
                accountId,
                pathname,
            }),
        );
        return resolveResponseData(response);
    } catch (error) {
        return createSiteMetadata(pathname, {
            openGraph: { images: [ogImageUrl] },
            twitter: { images: [ogImageUrl] },
        });
    }
}
