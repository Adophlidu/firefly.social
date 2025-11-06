import type { Metadata } from 'next';
import urlcat from 'urlcat';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { fetchMetadataApi } from '@/providers/firefly/metadatas/fetchMetadataApi.js';

export async function createArticleMetadata(articleId: string, pathname: string): Promise<Metadata> {
    try {
        const response = await fetchMetadataApi(
            urlcat('/metadata/article', {
                id: articleId,
                pathname,
            }),
        );
        const metadata = resolveResponseData(response);
        return metadata;
    } catch (error) {
        return createSiteMetadata(pathname);
    }
}
