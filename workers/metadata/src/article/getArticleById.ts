import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { first } from '@dimensiondev/workers-shared/helpers/first.js';
import { resolveFireflyResponseData } from '@dimensiondev/workers-shared/helpers/resolveFireflyResponseData.js';
import { resolveFireflyRootUrl } from '@dimensiondev/workers-shared/helpers/resolveFireflyRootUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';

import type { GetArticleDetailResponse } from '@/metadata/src/article/types.js';

export async function getArticleById(articleId: string, c: Context) {
    const url = urlcat(resolveFireflyRootUrl(c), '/v1/article/contents_by_ids');
    const response = await fetchJson<GetArticleDetailResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            ids: [articleId],
        }),
        context: c,
    });

    const data = resolveFireflyResponseData(response);
    return first(data);
}
