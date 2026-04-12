import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { Article } from '@/providers/types/Article.js';

export interface CollectArticleModalOpenProps {
    article: Article;
}

export type CollectArticleModalRefType = SingletonModalRefCreator<CollectArticleModalOpenProps>;

export const CollectArticleModalRef = new SingletonModal<CollectArticleModalOpenProps>();
