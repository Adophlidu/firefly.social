import urlcat from 'urlcat';

import { FireflyPlatform } from '@/constants/enum.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type Article } from '@/providers/types/Article.js';
import { settings } from '@/settings/index.js';

export async function reportArticle(article: Article) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/report/post/create');
    return fireflySessionHolder.fetch<string>(url, {
        method: 'POST',
        body: JSON.stringify({
            platform: FireflyPlatform.Article,
            platform_id: article.author.id,
            post_type: 'text',
            post_id: article.id,
        }),
    });
}
