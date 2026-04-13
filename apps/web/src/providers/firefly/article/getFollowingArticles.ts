import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { formatArticleFromFirefly } from '@/helpers/formatArticleFromFirefly.js';
import { isZero } from '@/helpers/number.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { ArticlePlatform } from '@/providers/types/Article.js';
import type { GetFollowingArticlesResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getFollowingArticles(indicator?: PageIndicator, platforms?: ArticlePlatform[]) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/timeline/articles');
    const response = await fireflySessionHolder.fetch<GetFollowingArticlesResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            size: 20,
            platform: platforms ? platforms.join(',') : undefined,
            cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
        }),
    });

    const data = resolveFireflyResponseData(response);

    const articles = data.result.map(formatArticleFromFirefly);

    return createPageable(
        articles,
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
    );
}
