import { ArticlePlatform } from '@dimensiondev/enums';

import type { Article } from '@/providers/types/Article.js';

export function getArticleHtmlContent(article: Pick<Article, 'platform' | 'content' | 'htmlContent'>) {
    if (article.platform === ArticlePlatform.Matters) {
        return article.htmlContent ?? article.content;
    }

    return article.content;
}
