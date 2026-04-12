import type { Metadata } from 'next';
import urlcat from 'urlcat';

import { SITE_URL } from '@/constants/static.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { fetchMetadataApi } from '@/providers/firefly/metadata/fetchMetadataApi.js';

export async function createPostMetadata(
    source: string,
    postId: string,
    pathname: string,
    searchParams?: Record<string, string | string[] | undefined>,
): Promise<Metadata> {
    const ogImageUrl = urlcat(SITE_URL, '/api/og/post/:source/:postId/image', { source, postId });

    try {
        const response = await fetchMetadataApi(
            urlcat('/metadata/post', {
                source,
                postId,
                pathname,
                ...searchParams,
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
