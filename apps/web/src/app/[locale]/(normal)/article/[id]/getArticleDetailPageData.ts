import { runInSafeAsync } from '@dimensiondev/utils';
import type { Metadata } from 'next';
import { cache } from 'react';

import { compactArticleForPageTransfer } from '@/helpers/compactArticleForPageTransfer.js';
import { createArticleMetadataFromArticle } from '@/helpers/createArticleMetadataFromArticle.js';
import { getArticleById } from '@/providers/firefly/article/getArticleById.js';
import { createArticleMetadata } from '@/providers/firefly/metadata/createArticleMetadata.js';
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

    return createArticleMetadata(articleId, pathname);
}
