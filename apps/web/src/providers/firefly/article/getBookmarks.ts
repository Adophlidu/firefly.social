import { FireflyPlatform } from '@dimensiondev/enums';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';
import { compact } from 'lodash-es';
import urlcat from 'urlcat';

import { BookmarkType } from '@/constants/enum.js';
import { formatArticleFromFirefly } from '@/helpers/formatArticleFromFirefly.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Article } from '@/providers/types/Article.js';
import type { Article as FFArticle, BookmarkResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getBookmarks(indicator?: PageIndicator): Promise<Pageable<Article, PageIndicator>> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/bookmark/find', {
        post_type: BookmarkType.All,
        platforms: FireflyPlatform.Article,
        limit: 25,
        cursor: indicator?.id || undefined,
    });
    const response = await fireflySessionHolder.fetch<BookmarkResponse<FFArticle>>(url);

    const posts = compact(
        response.data?.list.map((x) => (x.post_content ? formatArticleFromFirefly(x.post_content) : null)),
    );

    return createPageable(
        posts,
        createIndicator(indicator),
        response.data?.cursor ? createNextIndicator(indicator, `${response.data.cursor}`) : undefined,
    );
}
