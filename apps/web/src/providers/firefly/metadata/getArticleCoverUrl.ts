import { ArticlePlatform } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';
import { cache } from 'react';

import { getMirrorCoverFromArticleUrl } from '@/providers/firefly/metadata/getMirrorCoverFromArticleUrl.js';
import type { Article } from '@/providers/types/Article.js';

/**
 * Some platforms (e.g. Mirror) don't return a cover URL on the article itself; scrape one
 * from the article page when needed. Cached per request since this can be awaited from
 * both the page content and generateMetadata.
 */
export const getArticleCoverUrl = cache(async (article: Article): Promise<string | null> => {
    if (article.coverUrl) return article.coverUrl;
    if (article.platform !== ArticlePlatform.Mirror || !article.origin) return null;

    return (await runInSafeAsync(() => getMirrorCoverFromArticleUrl(article.origin!))) ?? null;
});
