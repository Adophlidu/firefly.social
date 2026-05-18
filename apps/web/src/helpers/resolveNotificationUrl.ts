import type { NotificationSource } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';

export function resolveNotificationUrl(source: NotificationSource) {
    return urlcat(`/notifications/:source`, {
        source: resolveSourceInUrl(source),
    });
}
