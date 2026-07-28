import '@/styles/limo.css';
import '@/styles/paragraph.css';

import { SITE_URL } from '@dimensiondev/envs/web';
import { type HeadContext, type LoaderContext, notFound, useLoaderData } from '@dimensiondev/ssr';
import urlcat from 'urlcat';

import { ArticleDetailContent } from '@/components/Article/ArticleDetailContent.js';
import { getArticleCoverUrl } from '@/providers/firefly/metadata/getArticleCoverUrl.js';
import { getArticleDetailPageData } from '@/providers/firefly/metadata/getArticleDetailPageData.js';
import type { Article } from '@/providers/types/Article.js';

/** Renders its own header — suppress the (normal) frame's NavigatorBar. */
export const topnav = () => null;

interface ArticleLoaderData {
    article: Article;
    cover: string | null;
}

export async function loader({ params }: LoaderContext): Promise<ArticleLoaderData> {
    if (!params.id) notFound();
    const article = await getArticleDetailPageData(params.id);
    if (!article) notFound();
    const cover = await getArticleCoverUrl(article);
    return { article, cover };
}

/**
 * Equivalent of getArticleDetailPageMetadata (which returns Next's Metadata
 * shape via createSiteMetadata), mapped onto the SSR library's head contract.
 */
export function head({ data }: HeadContext) {
    const { article } = (data ?? {}) as Partial<ArticleLoaderData>;
    if (!article) return { title: 'Firefly' };

    const title = `View ${article.title} on Firefly`;
    const raw = article.content?.trim();
    const description = raw ? (raw.length > 160 ? `${raw.slice(0, 157)}...` : raw) : undefined;
    const ogImage = urlcat(SITE_URL, '/api/og/article/:id/image', { id: article.id });

    return {
        title,
        meta: [
            ...(description ? [{ name: 'description', content: description }] : []),
            { property: 'og:type', content: 'article' },
            { property: 'og:url', content: urlcat(SITE_URL, `/article/${article.id}`) },
            { property: 'og:title', content: title },
            ...(description ? [{ property: 'og:description', content: description }] : []),
            { property: 'og:image', content: ogImage },
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: title },
            { name: 'twitter:image', content: ogImage },
        ],
    };
}

export default function ArticlePage() {
    const { article, cover } = useLoaderData<ArticleLoaderData>();
    return <ArticleDetailContent article={article} cover={cover} />;
}
