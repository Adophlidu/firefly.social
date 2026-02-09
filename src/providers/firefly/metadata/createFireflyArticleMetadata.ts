import { type Metadata } from 'next';
import urlcat from 'urlcat';

import { SourceInURL } from '@/constants/enum.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { fetchMetadataApi } from '@/providers/firefly/metadata/fetchMetadataApi.js';

export async function createFireflyArticleMetadata(
    articleId: string,
    source: SourceInURL,
    pathname: string,
): Promise<Metadata> {
    try {
        // Currently only supports Bsky
        if (source !== SourceInURL.Bsky) {
            return createSiteMetadata(pathname);
        }
        const response = await fetchMetadataApi(
            urlcat('/metadata/firefly-article', {
                id: articleId,
                pathname,
                source,
            }),
        );
        const metadata = resolveResponseData(response);
        return metadata;
    } catch {
        return createSiteMetadata(pathname);
    }
}
