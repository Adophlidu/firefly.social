import { runInSafeAsync } from '@dimensiondev/utils';
import type { Metadata } from '@/compat/nextMetadata.js';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { createArticleMetadataFromArticle } from '@/providers/firefly/metadata/createArticleMetadataFromArticle.js';
import { getArticleDetailPageData } from '@/providers/firefly/metadata/getArticleDetailPageData.js';

export async function getArticleDetailPageMetadata(articleId: string, pathname: string): Promise<Metadata> {
    const article = await runInSafeAsync(() => getArticleDetailPageData(articleId));
    if (article) {
        return createArticleMetadataFromArticle(article, pathname);
    }

    return createSiteMetadata(pathname);
}
