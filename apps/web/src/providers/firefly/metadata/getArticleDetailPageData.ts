import { runInSafeAsync } from '@dimensiondev/utils';
import type { Metadata } from 'next';
import { cache } from 'react';

import { compactArticleForPageTransfer } from '@/helpers/compactArticleForPageTransfer.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { getArticleById } from '@/providers/firefly/article/getArticleById.js';
import { createArticleMetadataFromArticle } from '@/providers/firefly/metadata/createArticleMetadataFromArticle.js';
import type { Article } from '@/providers/types/Article.js';

export const getArticleDetailPageData = cache(async (articleId: string): Promise<Article | null> => {
    const article = await getArticleById(articleId);
    if (!article) return null;
    return compactArticleForPageTransfer(article);
});

export async function getArticleDetailPageMetadata(articleId: string, pathname: string): Promise<Metadata> {
    const article = await runInSafeAsync(() => getArticleDetailPageData(articleId));
    if (article) {
        return createArticleMetadataFromArticle(article, pathname);
    }

    return createSiteMetadata(pathname);
}
