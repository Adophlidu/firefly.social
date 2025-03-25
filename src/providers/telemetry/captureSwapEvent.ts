import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import type { EventId } from '@/providers/types/Telemetry.js';
import { useFireflyStateStore } from '@/store/useProfileStore.js';

export function captureSwapEvent(
    eventId: EventId.EVENT_FOLLOWING_SWAP_CLICK | EventId.EVENT_LIKE_SWAP_CLICK | EventId.EVENT_SWAP_DETAIL_CLICK,
) {
    return runInSafeAsync(async () => {
        const accountId = useFireflyStateStore.getState().currentProfileSession?.profileId;
        if (!accountId) return;
        return TelemetryProvider.captureEvent(eventId, {
            firefly_account_id: `${accountId}`,
        });
    });
}
