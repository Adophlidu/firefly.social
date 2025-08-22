import dayjs from 'dayjs';
import urlcat from 'urlcat';

import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import {
    PostMediaType,
    type Response,
    type SchedulePostPayload,
    type ScheduleTasksResponse,
    ScheduleTaskStatus,
} from '@/providers/types/Firefly.js';
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

export async function getScheduledPosts(indicator?: PageIndicator, status?: ScheduleTaskStatus[]) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/post/schedule/history');
    const response = await fireflySessionHolder.fetch<ScheduleTasksResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            cursor: indicator?.id,
            size: 20,
            status: status?.join(','),
        }),
    });

    const data = resolveFireflyResponseData(response);

    return createPageable(
        data.posts,
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
    );
}
