import { fetchWithContext } from '@dimensiondev/workers-shared/helpers/fetchWithContext.js';
import { first } from '@dimensiondev/workers-shared/helpers/first.js';
import type { Context } from 'hono';

import { getMirrorPayload } from '@/metadata/src/article/getMirrorPayload.js';
import type { Article } from '@/metadata/src/article/types.js';

export async function getArticleCover(article: Article, c: Context): Promise<string | null> {
    if (!article) return null;
    if (article.cover_img_url) return article.cover_img_url;

    const articleUrl = first(article.related_urls);
    if (!articleUrl) return null;

    if (article.platform === 'mirror') {
        const response = await fetchWithContext(articleUrl, {
            headers: {
                'User-Agent': 'Twitterbot',
            },
            context: c,
        });
        if (!response.ok || (response.status >= 500 && response.status < 600)) return null;

        const html = await response.text();
        const payload = await getMirrorPayload(html);
        if (!payload?.cover) return null;
        return payload.cover;
    }
    return null;
}
