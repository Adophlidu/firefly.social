import type { SocialSourceInURL } from '@dimensiondev/enums';
import { SourceInURL } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';
import type { Metadata } from 'next';

import { getArticleDetailPageData } from '@/app/[locale]/(normal)/article/[id]/getArticleDetailPageData.js';
import { createFireflyArticleMetadataFromArticle } from '@/helpers/createFireflyArticleMetadataFromArticle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export async function getFireflyArticlePageMetadata(
    articleId: string,
    source: SocialSourceInURL,
    pathname: string,
): Promise<Metadata> {
    if (source !== SourceInURL.Bsky) {
        return createSiteMetadata(pathname);
    }

    const article = await runInSafeAsync(() => getArticleDetailPageData(articleId));
    if (!article) {
        return createSiteMetadata(pathname);
    }

    return createFireflyArticleMetadataFromArticle(article, source, pathname);
}
