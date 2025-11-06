import { first } from 'lodash-es';
import urlcat from 'urlcat';

import { formatArticleFromFirefly } from '@/helpers/formatArticleFromFirefly.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { GetArticleDetailResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getArticleById(articleId: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/article/contents_by_ids');

    const response = await fireflySessionHolder.fetch<GetArticleDetailResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            ids: [articleId],
        }),
    });

    const data = resolveFireflyResponseData(response);

    const article = first(data);
    if (!article) return null;

    return formatArticleFromFirefly(article);
}
