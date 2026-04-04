import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

export async function captureNotificationMenuClick() {
    return TelemetryProvider.captureEventInSafe(EventId.NEW_NOTIFICATION_CLICK, {});
}
