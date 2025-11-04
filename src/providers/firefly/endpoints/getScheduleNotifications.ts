import { compact, first } from 'lodash-es';
import urlcat from 'urlcat';

import { Source } from '@/constants/enum.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import {
    type ScheduleNotification,
    type ScheduleNotificationData,
    type ScheduleNotificationsResponse,
    ScheduleTaskStatus,
} from '@/providers/types/Firefly.js';
import { NotificationType } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

function formatScheduleNotification(notification: ScheduleNotificationData) {
    const posts = notification.posts.filter((post) => post.status !== ScheduleTaskStatus.Pending);
    if (!posts.length) return;
    const successPosts = posts.filter((post) => post.status === ScheduleTaskStatus.Success);
    const failedPosts = posts.filter((post) => post.status === ScheduleTaskStatus.Failed);
    const timestamp = first(posts)?.publish_timestamp;
    return compact([
        successPosts.length
            ? {
                  source: Source.Firefly,
                  type: NotificationType.Schedule,
                  data: {
                      ...notification,
                      posts: successPosts,
                  },
                  timestamp: timestamp ? new Date(timestamp).getTime() : null,
                  notificationId: `${NotificationType.Schedule}-${notification.task_uuid}-${ScheduleTaskStatus.Success}`,
                  status: ScheduleTaskStatus.Success,
              }
            : null,
        failedPosts.length
            ? {
                  source: Source.Firefly,
                  type: NotificationType.Schedule,
                  data: {
                      ...notification,
                      posts: failedPosts,
                  },
                  timestamp: timestamp ? new Date(timestamp).getTime() : null,
                  notificationId: `${NotificationType.Schedule}-${notification.task_uuid}-${ScheduleTaskStatus.Failed}`,
                  status: ScheduleTaskStatus.Failed,
              }
            : null,
    ]) as ScheduleNotification[];
}

export async function getScheduleNotifications(indicator?: PageIndicator) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/notification/schedule-posts', {
        cursor: indicator?.id && indicator.id !== '0' ? indicator.id : undefined,
        size: 20,
    });
    const response = await fireflySessionHolder.fetch<ScheduleNotificationsResponse>(url);

    const data = resolveFireflyResponseData(response);
    return createPageable(
        compact(data.notifications.map(formatScheduleNotification)).flat(),
        createIndicator(),
        data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
    );
}
