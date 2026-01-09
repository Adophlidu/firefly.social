import urlcat from 'urlcat';

import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type ScheduleTasksResponse, type ScheduleTaskStatus } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

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
