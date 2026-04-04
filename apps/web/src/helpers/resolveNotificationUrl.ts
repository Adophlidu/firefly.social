import urlcat from 'urlcat';

import { type NotificationSource } from '@/constants/enum.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';

export function resolveNotificationUrl(source: NotificationSource) {
    return urlcat(`/notifications/:source`, {
        source: resolveSourceInUrl(source),
    });
}
