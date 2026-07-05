import { SITE_URL } from '@dimensiondev/envs/web';
import type { Metadata } from 'next';
import urlcat from 'urlcat';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveArticleCoverUrl } from '@/helpers/resolveArticleCoverUrl.js';
import type { Article } from '@/providers/types/Article.js';

function getArticleDescription(article: Article) {
    const description = article.content?.trim();
    if (!description) return undefined;
    return description.length > 160 ? `${description.slice(0, 157)}...` : description;
}

export async function createArticleMetadataFromArticle(article: Article, pathname: string): Promise<Metadata> {
    const title = `View ${article.title} on Firefly`;
    const description = getArticleDescription(article);
    const coverUrl = await resolveArticleCoverUrl(article);
    const images = coverUrl ? [coverUrl] : undefined;

    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            type: 'article',
            url: urlcat(SITE_URL, `/article/${article.id}`),
            title,
            description,
            images,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        },
    });
}
