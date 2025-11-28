import dayjs from 'dayjs';
import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { PostMediaType, type Response, type SchedulePostPayload } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function schedulePost(
    scheduleTime: Date,
    posts: SchedulePostPayload[],
    displayInfo: { content: string; media_type: PostMediaType[] },
) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/post/schedule');

    const response = await fireflySessionHolder.fetch<Response<{ taskId: string }>>(
        url,
        {
            method: 'POST',
            body: JSON.stringify({
                scheduleTime: dayjs(scheduleTime).toISOString(),
                posts,
                display_info: displayInfo,
                ua_type: 'web',
                groupId: crypto.randomUUID(),
            }),
        },
        {
            withSession: true,
        },
    );
    if (response.data?.taskId) return response.data.taskId;
    throw new Error('Failed to create scheduled post.');
}
