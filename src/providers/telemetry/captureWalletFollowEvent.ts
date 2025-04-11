import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

export function captureWalletFollowEvent() {
    return runInSafeAsync(() => {
        return TelemetryProvider.captureEvent(EventId.WALLET_FOLLOW_SUCCESS, {});
    });
}

export function captureWalletUnfollowEvent() {
    return runInSafeAsync(() => {
        return TelemetryProvider.captureEvent(EventId.WALLET_UNFOLLOW_SUCCESS, {});
    });
}
