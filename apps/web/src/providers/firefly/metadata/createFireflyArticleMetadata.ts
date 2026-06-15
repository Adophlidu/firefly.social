import { SourceInURL } from '@dimensiondev/enums';
import { metadataWorker } from '@dimensiondev/workers-client';
import type { Metadata } from 'next';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { settings } from '@/settings/index.js';

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
        const res = await metadataWorker['metadata-v2']['firefly-article'].$get(
            { query: { id: articleId, pathname, source } },
            { headers: { 'X-DEVELOPMENT-API': settings.dev ? 'true' : 'false' } },
        );
        if (!res.ok) return createSiteMetadata(pathname);
        const json = await res.json();
        return resolveResponseData(json);
    } catch {
        return createSiteMetadata(pathname);
    }
}
