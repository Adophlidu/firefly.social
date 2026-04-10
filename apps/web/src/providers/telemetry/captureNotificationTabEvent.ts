import { createLookupTableResolver, runInSafeAsync, UnreachableError } from '@dimensiondev/utils';

import { type NotificationSource, Source } from '@/constants/enum.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

const resolveNotificationTabEventId = createLookupTableResolver<NotificationSource, EventId>(
    {
        [Source.Notifications]: EventId.NOTIFICATION_ALL_TAB_CLICK,
        [Source.Twitter]: EventId.NOTIFICATION_X_TAB_CLICK,
        [Source.Lens]: EventId.NOTIFICATION_LENS_TAB_CLICK,
        [Source.Farcaster]: EventId.NOTIFICATION_FARCASTER_TAB_CLICK,
        [Source.Bsky]: EventId.NOTIFICATION_BSKY_TAB_CLICK,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

export function captureNotificationTabClick(source: NotificationSource) {
    return runInSafeAsync(() => {
        const eventId = resolveNotificationTabEventId(source);
        return TelemetryProvider.captureEvent(eventId, {});
    });
}
