import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId, type Events } from '@/providers/types/Telemetry.js';

export function captureTokenBookmarkClickEvent() {
    return runInSafeAsync(() => {
        return TelemetryProvider.captureEvent(EventId.TOKEN_BOOKMARK_CLICK, {});
    });
}

type Source = Events[EventId.BOOKMARK_TOKEN_VIEW]['parameters']['source'];
export function captureBookmarkTokenViewEvent(source: Source) {
    return runInSafeAsync(() => {
        return TelemetryProvider.captureEvent(EventId.BOOKMARK_TOKEN_VIEW, { source });
    });
}
