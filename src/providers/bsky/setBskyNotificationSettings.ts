import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { type NotificationSettings } from '@/providers/types/Firefly.js';

export async function setBskyNotificationSettings(settings: NotificationSettings): Promise<boolean> {
    const response = await bskySessionHolder.agent.app.bsky.notification.putPreferences({
        priority: settings.priority,
    });
    if (!response.success) return false;
    return true;
}
