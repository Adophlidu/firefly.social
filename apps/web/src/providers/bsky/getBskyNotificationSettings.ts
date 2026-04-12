import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import type { NotificationSettings } from '@/providers/types/Firefly.js';

export async function getBskyNotificationSettings(signal?: AbortSignal): Promise<NotificationSettings> {
    const response = await bskySessionHolder.agent.listNotifications(
        {
            limit: 1,
        },
        { signal },
    );

    return {
        priority: response.data?.priority ?? false,
    };
}
