import type { WaitForTransactionReceiptReturnType } from 'wagmi/actions';

import { NotImplementedError } from '@/constants/error.js';
import type { Pageable, PageIndicator } from '@/helpers/pageable.js';
import type { Article, ArticleCollectable, Provider } from '@/providers/types/Article.js';

class Matters implements Provider {
    async discoverArticles(indicator?: PageIndicator): Promise<Pageable<Article, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getArticleById(articleId: string): Promise<Article | null> {
        throw new NotImplementedError();
    }

    async getFollowingArticles(indicator?: PageIndicator): Promise<Pageable<Article, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getArticleCollectableByDigest(digest: string): Promise<ArticleCollectable> {
        throw new NotImplementedError('Matters platform does not support NFT collection');
    }

    async estimateCollectGas(article: ArticleCollectable): Promise<bigint> {
        throw new NotImplementedError();
    }

    async collect(article: ArticleCollectable): Promise<WaitForTransactionReceiptReturnType> {
        throw new NotImplementedError();
    }
}

export const MattersAPI = new Matters();
