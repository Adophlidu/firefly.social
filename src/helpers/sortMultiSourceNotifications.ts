import { type Notification as NotificationObject } from '@/providers/types/SocialMedia.js';

export function sortMultiSourceNotifications(data: NotificationObject[]): NotificationObject[] {
    return data.concat().sort((a, b) => {
        if (a.timestamp && b.timestamp) return b.timestamp - a.timestamp;
        return 0;
    });
}
