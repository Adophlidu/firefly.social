import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { resolveFireflyRootUrl } from '@dimensiondev/workers-shared/helpers/resolveFireflyRootUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { FireflyResponse } from '@dimensiondev/workers-shared/types/firefly.js';
import type { Context } from 'hono';

export type DigestResponse = FireflyResponse<{
    type: string;
    paragraph?: {
        id: string;
    };
}>;

export async function getParagraphArticleIdWithLink(digest: string, c: Context) {
    const url = urlcat(resolveFireflyRootUrl(c), '/v2/misc/linkDigestCache');

    const response = await fetchJson<DigestResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            link: digest,
        }),
        context: c,
    });

    if (!response.data?.paragraph) return;

    return response.data.paragraph.id;
}
