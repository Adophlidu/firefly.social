import urlcat from 'urlcat';

import { resolveSourceInUrlForApi } from '@/helpers/resolveSourceInUrl.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function reportPost(post: Post): Promise<boolean> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/report/post/create');
    await fireflySessionHolder.fetch<string>(url, {
        method: 'POST',
        body: JSON.stringify({
            platform: resolveSourceInUrlForApi(post.source),
            platform_id: post.author.profileId,
            post_type: 'text',
            post_id: post.postId,
        }),
    });
    return true;
}
