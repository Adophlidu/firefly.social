import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { PostArticlePayload, PostArticleResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

/**
 * Create a new article post in Firefly
 * @param contentTitle - The article title
 * @param contentBody - The article content (rich text with emojis, links, formatting)
 * @param platformUid - The platform uid (e.g., user's platform identifier)
 * @returns The created article ID
 */
export async function postArticle(contentTitle: string, contentBody: string, platformUid: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/article/postArticle');

    const payload: PostArticlePayload = {
        content_title: contentTitle,
        content_body: contentBody,
        platform_uid: platformUid,
    };

    const response = await fireflySessionHolder.fetch<PostArticleResponse>(url, {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    const data = resolveFireflyResponseData(response);

    return data;
}
