import { UNIFIED_NOTIFICATION_TYPES } from '@dimensiondev/constants/computed';
import { NotificationType } from '@dimensiondev/enums';

import { NotificationItem } from '@/components/Notification/NotificationItem.js';
import { ScheduleNotificationItem } from '@/components/Notification/ScheduleNotificationItem.js';
import { TipsNotificationItem } from '@/components/Notification/TipsNotificationItem.js';
import { UnifiedNotificationItem } from '@/components/Notification/UnifiedNotificationItem.js';
import type {
    ScheduleNotification,
    TipsNotification,
    TipsNotificationData,
    UnifiedNotification,
} from '@/providers/types/Firefly.js';
import type { Notification as NotificationObject } from '@/providers/types/SocialMedia.js';

export function getNotificationItemContent(index: number, notification: NotificationObject) {
    if (notification.type === NotificationType.Tips) {
        return (
            <TipsNotificationItem key={notification.notificationId} data={notification.data as TipsNotificationData} />
        );
    }

    if (notification.type === NotificationType.Schedule) {
        return (
            <ScheduleNotificationItem key={notification.notificationId} data={notification as ScheduleNotification} />
        );
    }

    if (UNIFIED_NOTIFICATION_TYPES.includes(notification.type as NotificationType)) {
        return (
            <UnifiedNotificationItem
                key={notification.notificationId}
                notification={notification as UnifiedNotification}
            />
        );
    }

    type SocialNotification = Exclude<
        NotificationObject,
        UnifiedNotification | TipsNotification | ScheduleNotification
    >;
    return <NotificationItem key={notification.notificationId} notification={notification as SocialNotification} />;
}
