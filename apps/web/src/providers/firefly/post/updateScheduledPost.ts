import dayjs from 'dayjs';
import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function updateScheduledPost(id: string, scheduleTime: Date) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/post/updateTasks');
    const response = await fireflySessionHolder.fetch<Response<string>>(
        url,
        {
            method: 'POST',
            body: JSON.stringify({
                taskUUID: id,
                publishTime: dayjs(scheduleTime).toISOString(),
                ua_type: 'web',
            }),
        },
        {
            withSession: true,
        },
    );
    if (response.data) return response.data;
    throw new Error('Failed to update scheduled post.');
}
