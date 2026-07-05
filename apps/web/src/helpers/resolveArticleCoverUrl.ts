import { first } from 'lodash-es';
import { cache } from 'react';

import { createArticleMetadata } from '@/providers/firefly/metadata/createArticleMetadata.js';
import type { Article } from '@/providers/types/Article.js';

/**
 * Some platforms (e.g. Mirror) don't return a cover URL on the article itself; the metadata
 * worker scrapes one from the article's own page in that case. Cached per request since this
 * can be awaited from both the page content and generateMetadata.
 */
export const resolveArticleCoverUrl = cache(async (article: Article): Promise<string | null> => {
    if (article.coverUrl) return article.coverUrl;

    const metadata = await createArticleMetadata(article.id, `/article/${article.id}`);
    return first(metadata.openGraph?.images as string[]) ?? null;
});
