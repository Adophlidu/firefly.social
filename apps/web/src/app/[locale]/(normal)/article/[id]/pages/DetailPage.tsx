import '@/styles/limo.css';
import '@/styles/paragraph.css';

import { first } from 'lodash-es';

import { ArticleDetailContent } from '@/components/Article/ArticleDetailContent.js';
import { notFound } from '@/esm/navigation/server.js';
import { getArticleById } from '@/providers/firefly/article/getArticleById.js';
import { createArticleMetadata } from '@/providers/firefly/metadata/createArticleMetadata.js';
import type { Article } from '@/providers/types/Article.js';

async function getArticleCoverUrl(article: Article): Promise<string | null> {
    if (article.coverUrl) return article.coverUrl;

    const metadata = await createArticleMetadata(article.id, `/article/${article.id}`);
    return first(metadata.openGraph?.images as string[]) ?? null;
}

interface Props {
    id: string;
}

export async function ArticleDetailPage({ id: articleId }: Props) {
    if (!articleId) notFound();

    const article = await getArticleById(articleId);
    if (!article) notFound();

    const coverUrl = await getArticleCoverUrl(article);
    return <ArticleDetailContent article={article} cover={coverUrl} />;
}
