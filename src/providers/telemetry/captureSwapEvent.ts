import { runInSafeAsync } from '@/helpers/runInSafe.js';
import type { FireflySession } from '@/providers/firefly/Session.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId, type Events } from '@/providers/types/Telemetry.js';
import { useFireflyStateStore } from '@/store/useProfileStore.js';

export function captureSwapEvent(
    eventId:
        | EventId.EVENT_FOLLOWING_SWAP_CLICK
        | EventId.EVENT_LIKE_SWAP_CLICK
        | EventId.EVENT_SWAP_DETAIL_CLICK
        | EventId.EVENT_SWAP_COPY_TRADE_CLICK,
): void;
export function captureSwapEvent(
    eventId: EventId.EVENT_SWAP_SUCCESS,
    options: Events[EventId.EVENT_SWAP_SUCCESS]['parameters'],
): void;

export function captureSwapEvent(
    eventId:
        | EventId.EVENT_FOLLOWING_SWAP_CLICK
        | EventId.EVENT_LIKE_SWAP_CLICK
        | EventId.EVENT_SWAP_DETAIL_CLICK
        | EventId.EVENT_SWAP_COPY_TRADE_CLICK
        | EventId.EVENT_SWAP_SUCCESS,
    options?: Events[EventId.EVENT_SWAP_SUCCESS]['parameters'],
) {
    return runInSafeAsync(async () => {
        const fireflySession = useFireflyStateStore.getState().currentProfileSession as FireflySession | null;
        if (!fireflySession) {
            console.warn('No firefly session to capture swap event');
            return;
        }

        return TelemetryProvider.captureEvent(eventId, {
            firefly_account_id: `${fireflySession.accountIdForEvent}`,
            ...options!,
        });
    });
}
