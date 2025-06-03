import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

export async function captureSetPasscodeEvent() {
    return TelemetryProvider.captureEventInSafe(EventId.PASSCODE_SET_SUCCESS, {});
}

export async function captureChangePasscodeEvent() {
    return TelemetryProvider.captureEventInSafe(EventId.PASSCODE_CHANGE_SUCCESS, {});
}

export async function captureRemovePasscodeEvent() {
    return TelemetryProvider.captureEventInSafe(EventId.PASSCODE_REMOVE_SUCCESS, {});
}

export async function captureResetPasscodeEvent() {
    return TelemetryProvider.captureEventInSafe(EventId.PASSCODE_RESET_SUCCESS, {});
}
