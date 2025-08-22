import { NotificationItem } from '@/components/Notification/NotificationItem.js';
import { ScheduleNotificationItem } from '@/components/Notification/ScheduleNotificationItem.js';
import { TipsNotificationItem } from '@/components/Notification/TipsNotificationItem.js';
import { type Notification as NotificationObject, NotificationType } from '@/providers/types/SocialMedia.js';

export function getNotificationItemContent(index: number, notification: NotificationObject) {
    if (notification.type === NotificationType.Tips) {
        return <TipsNotificationItem key={notification.notificationId} data={notification.data} />;
    }

    if (notification.type === NotificationType.Schedule) {
        return <ScheduleNotificationItem key={notification.notificationId} data={notification} />;
    }

    return <NotificationItem key={notification.notificationId} notification={notification} />;
}
