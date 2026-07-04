import { cache } from 'react';

import { compactArticleForPageTransfer } from '@/helpers/compactArticleForPageTransfer.js';
import { getArticleById } from '@/providers/firefly/article/getArticleById.js';
import type { Article } from '@/providers/types/Article.js';

export const getArticleDetailPageData = cache(async (articleId: string): Promise<Article | null> => {
    const article = await getArticleById(articleId);
    if (!article) return null;
    return compactArticleForPageTransfer(article);
});
