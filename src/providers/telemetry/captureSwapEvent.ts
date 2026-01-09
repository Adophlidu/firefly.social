import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { type EventId, type Events } from '@/providers/types/Telemetry.js';

export function captureSwapEvent(
    eventId:
        | EventId.EVENT_FOLLOWING_SWAP_CLICK
        | EventId.EVENT_LIKE_SWAP_CLICK
        | EventId.EVENT_SWAP_DETAIL_CLICK
        | EventId.EVENT_SWAP_COPY_TRADE_CLICK,
): void;
export function captureSwapEvent(
    eventId: EventId.EVENT_SWAP_SUCCESS | EventId.EVENT_SWAP_SUBMIT,
    options: Events[EventId.EVENT_SWAP_SUCCESS]['parameters'],
): void;

export function captureSwapEvent(
    eventId:
        | EventId.EVENT_FOLLOWING_SWAP_CLICK
        | EventId.EVENT_LIKE_SWAP_CLICK
        | EventId.EVENT_SWAP_DETAIL_CLICK
        | EventId.EVENT_SWAP_COPY_TRADE_CLICK
        | EventId.EVENT_SWAP_SUCCESS
        | EventId.EVENT_SWAP_SUBMIT,
    options?: Events[EventId.EVENT_SWAP_SUCCESS]['parameters'],
) {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(eventId, options ?? {});
    });
}
