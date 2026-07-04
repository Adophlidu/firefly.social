import '@/styles/limo.css';
import '@/styles/paragraph.css';

import { first } from 'lodash-es';

import { getArticleDetailPageData } from '@/app/[locale]/(normal)/article/[id]/getArticleDetailPageData.js';
import { ArticleDetailContent } from '@/components/Article/ArticleDetailContent.js';
import { notFound } from '@/esm/navigation/server.js';
import { createArticleMetadata } from '@/providers/firefly/metadata/createArticleMetadata.js';

async function getArticleCoverUrl(articleId: string, coverUrl: string | null): Promise<string | null> {
    if (coverUrl) return coverUrl;

    const metadata = await createArticleMetadata(articleId, `/article/${articleId}`);
    return first(metadata.openGraph?.images as string[]) ?? null;
}

interface Props {
    id: string;
}

export async function ArticleDetailPage({ id: articleId }: Props) {
    if (!articleId) notFound();

    const article = await getArticleDetailPageData(articleId);
    if (!article) notFound();

    const coverUrl = await getArticleCoverUrl(articleId, article.coverUrl);
    return <ArticleDetailContent article={article} cover={coverUrl} />;
}
