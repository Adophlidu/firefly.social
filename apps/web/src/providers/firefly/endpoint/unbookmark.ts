import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { settings } from '@/settings/index.js';

export async function unbookmark(postId: string): Promise<boolean> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/bookmark/remove');
    const response = await fireflySessionHolder.fetch<string>(url, {
        method: 'POST',
        body: JSON.stringify({
            post_ids: [postId],
        }),
    });
    if (response) return true;
    throw new Error('Failed to remove bookmark.');
}
