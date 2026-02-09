import urlcat from 'urlcat';

import type { FireflyPlatform } from '@/constants/enum.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type UpdateArticlePayload, type UpdateArticleResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

/**
 * Update article with platform post information
 * Merges posts into custom_payload, deduplicating by platform
 * @param articleId - The Firefly article ID
 * @param platform - The platform name
 * @param postId - The platform-specific post ID
 */
export async function updateArticle(articleId: string, platform: FireflyPlatform, postId: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/article/updateArticle');

    const payload: UpdateArticlePayload = {
        articleId,
        custom_payload: {
            posts: [
                {
                    platform,
                    postId,
                },
            ],
        },
    };

    const response = await fireflySessionHolder.fetch<UpdateArticleResponse>(url, {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    const data = resolveFireflyResponseData(response);

    return data;
}
