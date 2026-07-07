import '@/styles/limo.css';
import '@/styles/paragraph.css';

import { getArticleDetailPageData } from '@/providers/firefly/metadata/getArticleDetailPageData.js';
import { ArticleDetailContent } from '@/components/Article/ArticleDetailContent.js';
import { notFound } from '@/esm/navigation/server.js';
import { resolveArticleCoverUrl } from '@/providers/firefly/metadata/resolveArticleCoverUrl.js';

interface Props {
    id: string;
}

export async function ArticleDetailPage({ id: articleId }: Props) {
    if (!articleId) notFound();

    const article = await getArticleDetailPageData(articleId);
    if (!article) notFound();

    const coverUrl = await resolveArticleCoverUrl(article);
    return <ArticleDetailContent article={article} cover={coverUrl} />;
}
