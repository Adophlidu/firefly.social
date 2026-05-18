import { ArticlePlatform, ArticleType, WatchType } from '@dimensiondev/enums';
import { MATTERS_ARTICLE_URL } from '@dimensiondev/workers-shared/constants/matters.js';
import { isSameAddress } from '@dimensiondev/workers-shared/helpers/isSameAddress.js';
import { parseParagraphHtml } from '@dimensiondev/workers-shared/helpers/parseParagraphHtml.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Article } from '@dimensiondev/workers-shared/types/article.js';

import type { Article as FireflyArticle } from '@/metadata/src/article/types.js';

export async function formatArticleFromFirefly(article: FireflyArticle): Promise<Article> {
    const isMattersArticle = article.platform === ArticlePlatform.Matters;
    const authorId = article.owner;
    return {
        platform: article.platform,
        type: article.platform === ArticlePlatform.Limo ? ArticleType.Post : article.type,
        content:
            article.platform === ArticlePlatform.Paragraph &&
            article.paragraph_raw_data?.staticHtml &&
            article.paragraph_raw_data.json
                ? ((await parseParagraphHtml(article.paragraph_raw_data.staticHtml, article.paragraph_raw_data.json)) ??
                  article.paragraph_raw_data.staticHtml)
                : article.content.body,
        title: article.content.title,
        author: {
            handle: (isMattersArticle ? article.authorship?.displayName : article.displayInfo.ensHandle) || 'NaN',
            avatar: article.displayInfo.avatarUrl,
            id: authorId,
            isFollowing: article.followingSources.some(
                (x) => x.type === WatchType.Wallet && isSameAddress(x.walletAddress, authorId),
            ),
            /** Article in timeline are all not muted */
            isMuted: false,
            username: article.authorship?.userName || '',
            displayName: article.authorship?.displayName || '',
            info: article.authorship?.info || { ethAddress: '' },
        },
        origin: isMattersArticle
            ? urlcat(MATTERS_ARTICLE_URL, '', { shortHash: article.article_id })
            : article.related_urls?.[0],
        id: article.article_id,
        hash: article.hash,
        timestamp: article.timestamp,
        coverUrl: article.cover_img_url,
        hasBookmarked: article.has_bookmarked,
        followingSources: article.followingSources,
        slug: article.paragraph_raw_data?.slug,
        // paragraph only
        json: article.paragraph_raw_data?.json,
        displayInfo: article.displayInfo,
    };
}
