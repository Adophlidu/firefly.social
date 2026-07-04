import '@/styles/limo.css';
import '@/styles/paragraph.css';

import { getArticleDetailPageData } from '@/app/[locale]/(normal)/article/[id]/getArticleDetailPageData.js';
import { ArticleDetailContent } from '@/components/Article/ArticleDetailContent.js';
import { notFound } from '@/esm/navigation/server.js';

interface Props {
    id: string;
}

export async function ArticleDetailPage({ id: articleId }: Props) {
    if (!articleId) notFound();

    const article = await getArticleDetailPageData(articleId);
    if (!article) notFound();

    const coverUrl = article.coverUrl;
    return <ArticleDetailContent article={article} cover={coverUrl} />;
}
