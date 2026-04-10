import { runInSafeAsync } from '@dimensiondev/utils';

import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { type EventId, type Events } from '@/providers/types/Telemetry.js';

export function captureSwapEvent(
    eventId:
        | EventId.EVENT_FOLLOWING_SWAP_CLICK
        | EventId.EVENT_FOR_YOU_SWAP_CLICK
        | EventId.EVENT_LIKE_SWAP_CLICK
        | EventId.EVENT_SWAP_DETAIL_CLICK
        | EventId.EVENT_SWAP_COPY_TRADE_CLICK,
): void;
export function captureSwapEvent(
    eventId: EventId.EVENT_SWAP_SUCCESS | EventId.EVENT_SWAP_SUBMIT,
    options: Events[EventId.EVENT_SWAP_SUCCESS]['parameters'],
): void;
export function captureSwapEvent(
    eventId: EventId.EVENT_BRIDGE_SUCCESS | EventId.EVENT_BRIDGE_SUBMIT,
    options: Events[EventId.EVENT_BRIDGE_SUCCESS]['parameters'],
): void;
export function captureSwapEvent(
    eventId: EventId.EVENT_SWAP_SKIP_REVIEWS_DISABLE,
    options: Events[EventId.EVENT_SWAP_SKIP_REVIEWS_DISABLE]['parameters'],
): void;
export function captureSwapEvent(
    eventId: EventId.EVENT_SWAP_CUSTOM_SLIPPAGE,
    options: Events[EventId.EVENT_SWAP_CUSTOM_SLIPPAGE]['parameters'],
): void;

export function captureSwapEvent(
    eventId:
        | EventId.EVENT_FOLLOWING_SWAP_CLICK
        | EventId.EVENT_FOR_YOU_SWAP_CLICK
        | EventId.EVENT_LIKE_SWAP_CLICK
        | EventId.EVENT_SWAP_DETAIL_CLICK
        | EventId.EVENT_SWAP_COPY_TRADE_CLICK
        | EventId.EVENT_SWAP_SUCCESS
        | EventId.EVENT_SWAP_SUBMIT
        | EventId.EVENT_BRIDGE_SUCCESS
        | EventId.EVENT_BRIDGE_SUBMIT
        | EventId.EVENT_SWAP_SKIP_REVIEWS_DISABLE
        | EventId.EVENT_SWAP_CUSTOM_SLIPPAGE,
    options?:
        | Events[EventId.EVENT_SWAP_SUCCESS]['parameters']
        | Events[EventId.EVENT_BRIDGE_SUCCESS]['parameters']
        | Events[EventId.EVENT_SWAP_SKIP_REVIEWS_DISABLE]['parameters']
        | Events[EventId.EVENT_SWAP_CUSTOM_SLIPPAGE]['parameters'],
) {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(eventId, options ?? {});
    });
}
