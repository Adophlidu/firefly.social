import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { type NotificationSettings } from '@/providers/types/Firefly.js';

export async function getBskyNotificationSettings(): Promise<NotificationSettings> {
    const response = await bskySessionHolder.agent.listNotifications({
        limit: 1,
    });

    return {
        priority: response.data?.priority ?? false,
    };
}
