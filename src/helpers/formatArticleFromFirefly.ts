import { first } from 'lodash-es';
import urlcat from 'urlcat';

import { MATTERS_ARTICLE_URL } from '@/constants/matters.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { parseParagraphHtml } from '@/helpers/parseParagraphHtml.js';
import { type Article, ArticlePlatform, ArticleType } from '@/providers/types/Article.js';
import { type Article as FireflyArticle, WatchType } from '@/providers/types/Firefly.js';

function resolveArticleAuthor(article: FireflyArticle): Article['author'] {
    const isMattersArticle = article.platform === ArticlePlatform.Matters;
    let handle: string = article.displayInfoV2?.name || article.displayInfo.ensHandle || '';
    let userName: string = handle;
    let displayName: string = handle;
    let info = { ethAddress: '' };
    const authorId = article.owner;
    if (article.authorship) {
        if ('contributor' in article.authorship) {
            const formattedContributor = formatAddress(article.authorship.contributor, 4);
            handle = formattedContributor;
            userName = formattedContributor;
            displayName = formattedContributor;
            info = { ethAddress: article.authorship.contributor };
        } else {
            handle =
                (isMattersArticle ? article.authorship?.displayName : article.displayInfo.ensHandle) ||
                article.authorship?.displayName ||
                article.authorship?.userName ||
                'NaN';
            userName = article.authorship.userName || '';
            displayName = article.authorship.displayName || '';
            info = article.authorship.info;
        }
    } else if (article.platform === ArticlePlatform.Paragraph && !handle) {
        const match = article.author.match(/https:\/\/paragraph.com\/@(.*)/);
        const paragraphAuthorHandle = match ? match[1] : '';
        if (paragraphAuthorHandle) {
            handle = paragraphAuthorHandle;
            userName = paragraphAuthorHandle;
            displayName = paragraphAuthorHandle;
            info = { ethAddress: authorId };
        } else if ('paragraph_raw_data' in article) {
            const paragraphAuthor = first(article.paragraph_raw_data?.contributors);
            if (paragraphAuthor) {
                handle = paragraphAuthor;
                userName = paragraphAuthor;
                displayName = paragraphAuthor;
                info = { ethAddress: authorId };
            }
        }
    }
    return {
        handle,
        avatar: article.displayInfo.avatarUrl ?? '',
        id: authorId,
        isFollowing: article.followingSources.some(
            (x) => x.type === WatchType.Wallet && isSameEthereumAddress(x.walletAddress, authorId),
        ),
        /** Article in timeline are all not muted */
        isMuted: false,
        username: userName,
        displayName,
        info,
    };
}

export function formatArticleFromFirefly(article: FireflyArticle): Article {
    const isMattersArticle = article.platform === ArticlePlatform.Matters;
    const contentBody =
        article.platform === ArticlePlatform.Paragraph &&
        article.paragraph_raw_data?.staticHtml &&
        article.paragraph_raw_data.json
            ? (parseParagraphHtml(article.paragraph_raw_data.staticHtml, article.paragraph_raw_data.json) ??
              article.paragraph_raw_data.staticHtml)
            : article.content.body;

    return {
        platform: article.platform,
        type: article.platform === ArticlePlatform.Limo ? ArticleType.Post : article.type,
        content: contentBody,
        title: article.content.title,
        author: resolveArticleAuthor(article),
        origin: isMattersArticle
            ? urlcat(MATTERS_ARTICLE_URL, { shortHash: article.article_id })
            : first(article.related_urls),
        id: article.article_id,
        hash: article.hash,
        timestamp: article.timestamp,
        coverUrl: article.cover_img_url,
        hasBookmarked: article.has_bookmarked,
        isLiked: article.is_like,
        likeCount: article.like_count,
        followingSources: article.followingSources,
        slug: article.paragraph_raw_data?.slug,
        // paragraph only
        json: article.paragraph_raw_data?.json,
        displayInfo: article.displayInfo,
        // matters only
        htmlContent: isMattersArticle ? article.contents.body : undefined,
        // firefly only
        customPayload: article.custom_payload,
    };
}
