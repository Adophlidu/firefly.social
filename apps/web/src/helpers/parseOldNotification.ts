import { type NotificationSource, PageRoute } from '@dimensiondev/enums';

import { DEFAULT_NOTIFICATION_SOURCE } from '@/constants/computed.js';
import { isNotificationSource } from '@/helpers/isSource.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';

export function parseOldNotification(url: URL): { source: NotificationSource } | null {
    if (url.pathname !== PageRoute.Notifications) return null;

    const source = resolveSourceFromUrlNoFallback(url.searchParams.get('source'));
    if (!source || !isNotificationSource(source)) return { source: DEFAULT_NOTIFICATION_SOURCE };

    return { source };
}
