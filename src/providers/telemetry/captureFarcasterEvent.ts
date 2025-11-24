import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

export async function captureFirstTimeClickInLogin() {
    return TelemetryProvider.captureEventInSafe(EventId.FARCASTER_LOGIN_FIRST_TIME, {});
}

export async function captureReconnectClickInLogin() {
    return TelemetryProvider.captureEventInSafe(EventId.FARCASTER_LOGIN_RECONNECT, {});
}
