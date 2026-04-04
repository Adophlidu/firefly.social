import {
    NotificationPlatform,
    NotificationPushType,
    type NotificationSettings,
    NotificationTitle,
} from '@/providers/types/Firefly.js';

export async function getLensNotificationSettings(): Promise<NotificationSettings> {
    const { getNotificationPushSwitch } = await import('@/providers/firefly/endpoint/getNotificationPushSwitch.js');
    const settings = await getNotificationPushSwitch();
    const current = settings.list.find((x) => x.title === NotificationTitle.NotificationsMode);

    return {
        priority:
            current?.list.find(
                (x) => x.platform === NotificationPlatform.Priority && x.push_type === NotificationPushType.Lens,
            )?.state ?? false,
    };
}
