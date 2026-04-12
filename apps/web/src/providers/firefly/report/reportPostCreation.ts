import urlcat from 'urlcat';

import type { FireflyPlatform } from '@/constants/enum.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { settings } from '@/settings/index.js';

export async function reportPostCreation(
    platform: FireflyPlatform,
    platformId: string,
    mediaType: string[],
    postId: string,
    relationId: string,
    options?: {
        content?: string;
    },
) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/report/post/post_create');
    return fireflySessionHolder.fetchWithSession<string>(url, {
        method: 'POST',
        body: JSON.stringify({
            platform,
            platform_id: platformId,
            media_type: mediaType,
            post_id: postId,
            ua_type: 'web',
            relation_id: relationId,
            post_time: Math.floor(Date.now() / 1000),
            content: options?.content,
        }),
    });
}
