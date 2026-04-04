import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function deleteScheduledPost(id: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/post/deleteTask');
    const response = await fireflySessionHolder.fetch<Response<string>>(
        url,
        {
            method: 'POST',
            body: JSON.stringify({
                taskUUID: id,
            }),
        },
        {
            withSession: true,
        },
    );
    if (response.data) return true;
    throw new Error('Failed to delete scheduled post.');
}
