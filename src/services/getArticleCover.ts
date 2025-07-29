import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { type Article, ArticlePlatform } from '@/providers/types/Article.js';
import type { ResponseJson } from '@/types/index.js';
import { type LinkDigested, PayloadType } from '@/types/og.js';

export async function getArticleCover(article: Article): Promise<string | null> {
    if (!article) return null;
    if (article.coverUrl) return article.coverUrl;
    if (article.platform === ArticlePlatform.Mirror && article.origin) {
        const payload = await fetchJson<ResponseJson<LinkDigested>>(
            urlcat(FIREFLY_WORKER_HOST, '/oembed', {
                link: article.origin,
            }),
            undefined,
            { noStrictOK: true },
        );
        if (payload.success && payload.data.payload?.type === PayloadType.Mirror) {
            return payload.data.payload.cover || null;
        }
    }
    return null;
}
