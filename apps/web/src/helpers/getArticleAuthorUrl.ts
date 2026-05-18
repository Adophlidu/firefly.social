import { ArticlePlatform, SourceInURL } from '@dimensiondev/enums';
import { isValidAddressEthereum } from '@dimensiondev/web3/utils';
import urlcat from 'urlcat';

import { MATTERS_SITE_URL } from '@/constants/matters.js';
import type { Article } from '@/providers/types/Article.js';

export function getArticleAuthorUrl(article: Article): string {
    const isMattersArticle = article.platform === ArticlePlatform.Matters;
    const hasLinkedAddress = isMattersArticle && isValidAddressEthereum(article.author.info.ethAddress);

    if (hasLinkedAddress) {
        return urlcat('/profile/:address', {
            address: article.author.info.ethAddress,
            source: SourceInURL.Wallet,
        });
    } else if (isMattersArticle) {
        return urlcat(MATTERS_SITE_URL, `@${article.author.username}`);
    } else {
        return urlcat('/profile/:address', {
            address: article.author.id,
            source: SourceInURL.Wallet,
        });
    }
}

export function getArticleAuthorTarget(article: Article): string | undefined {
    const isMattersArticle = article.platform === ArticlePlatform.Matters;
    const hasLinkedAddress = isMattersArticle && isValidAddressEthereum(article.author.info.ethAddress);

    return isMattersArticle && !hasLinkedAddress ? '_blank' : undefined;
}
