import '@/styles/limo.css';
import '@/styles/paragraph.css';

import { ArticleDetailContent } from '@/components/Article/ArticleDetailContent.js';
import { notFound } from '@/esm/navigation/server.js';
import { getArticleCoverUrl } from '@/providers/firefly/metadata/getArticleCoverUrl.js';
import { getArticleDetailPageData } from '@/providers/firefly/metadata/getArticleDetailPageData.js';

interface Props {
    id: string;
}

export async function ArticleDetailPage({ id: articleId }: Props) {
    if (!articleId) notFound();

    const article = await getArticleDetailPageData(articleId);
    if (!article) notFound();

    const coverUrl = await getArticleCoverUrl(article);
    return <ArticleDetailContent article={article} cover={coverUrl} />;
}
