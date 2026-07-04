import { ArticlePlatform } from '@dimensiondev/enums';

import type { Article } from '@/providers/types/Article.js';

/** Drop redundant/heavy fields before passing article data through the RSC client boundary. */
export function compactArticleForPageTransfer(article: Article): Article {
    const htmlContent =
        article.platform === ArticlePlatform.Matters && article.content ? undefined : article.htmlContent;

    return {
        ...article,
        json: undefined,
        htmlContent,
        followingSources: [],
        customPayload: undefined,
        displayInfo: {
            avatarUrl: article.displayInfo.avatarUrl,
            ensHandle: article.displayInfo.ensHandle,
            fireflyName: article.displayInfo.fireflyName,
            fireflyUid: article.displayInfo.fireflyUid,
            fireflyAvatarUrl: article.displayInfo.fireflyAvatarUrl,
        },
    };
}
