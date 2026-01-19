import { NotificationPlatform, NotificationPushType, type NotificationSettings } from '@/providers/types/Firefly.js';

export async function setLensNotificationSettings(settings: NotificationSettings) {
    const { setNotificationPushSwitch } = await import('@/providers/firefly/endpoint/setNotificationPushSwitch.js');
    await setNotificationPushSwitch({
        list: [
            {
                platform: NotificationPlatform.Priority,
                push_type: NotificationPushType.Lens,
                state: settings.priority,
            },
        ],
    });
    return true;
}
