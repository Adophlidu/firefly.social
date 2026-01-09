import urlcat from 'urlcat';

import { Locale } from '@/constants/enum.js';
import { formatArticleFromFirefly } from '@/helpers/formatArticleFromFirefly.js';
import { getLocalFromClientCookies } from '@/helpers/getCookies.js';
import { isZero } from '@/helpers/number.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { ArticlePlatform } from '@/providers/types/Article.js';
import { type DiscoverArticlesResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

const defaultPlatforms = [ArticlePlatform.Paragraph, ArticlePlatform.Mirror, ArticlePlatform.Matters];

export async function discoverArticles(indicator?: PageIndicator, platforms = defaultPlatforms) {
    const userLocale = getLocalFromClientCookies();
    const languageParam = userLocale === Locale.zhHans || userLocale === Locale.zhHant ? 'cn' : 'en';

    const platform =
        platforms && platforms.length > 0
            ? platforms.join(',')
            : defaultPlatforms
                  .filter((x) =>
                      languageParam === 'cn' ? x !== ArticlePlatform.Matters : x !== ArticlePlatform.Mirror,
                  )
                  .join(',');
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/discover/articles/timeline_v2', {
        size: 20,
        platform,
        cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
        language: languageParam,
    });

    const response = await fireflySessionHolder.fetch<DiscoverArticlesResponse>(url);

    const data = resolveFireflyResponseData(response);
    const articles = data.result.map(formatArticleFromFirefly);

    return createPageable(
        articles,
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
    );
}
