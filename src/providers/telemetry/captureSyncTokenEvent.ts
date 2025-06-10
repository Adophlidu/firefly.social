import { runInSafeAsync } from '@/helpers/runInSafe.js';
import type { FireflySession } from '@/providers/firefly/Session.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { useFireflyStateStore } from '@/store/useProfileStore.js';

export async function captureTokenSyncYesEvent() {
    return runInSafeAsync(async () => {
        const fireflySession = useFireflyStateStore.getState().currentProfileSession as FireflySession | null;
        if (!fireflySession) return;

        return TelemetryProvider.captureEvent(EventId.TOKEN_SYNC_USE_YES, {
            firefly_account_id: `${fireflySession.accountIdForEvent}`,
        });
    });
}

export async function captureTokenSyncNoEvent() {
    return runInSafeAsync(async () => {
        const fireflySession = useFireflyStateStore.getState().currentProfileSession as FireflySession | null;
        if (!fireflySession) return;

        return TelemetryProvider.captureEvent(EventId.TOKEN_SYNC_USE_NO, {
            firefly_account_id: `${fireflySession.accountIdForEvent}`,
        });
    });
}

export async function captureAccountConflictYesEvent() {
    return runInSafeAsync(async () => {
        const fireflySession = useFireflyStateStore.getState().currentProfileSession as FireflySession | null;
        if (!fireflySession) return;

        return TelemetryProvider.captureEvent(EventId.ACCOUNT_CONFLICT_USE_YES, {
            firefly_account_id: `${fireflySession.accountIdForEvent}`,
        });
    });
}

export async function captureAccountConflictNoEvent() {
    return runInSafeAsync(async () => {
        const fireflySession = useFireflyStateStore.getState().currentProfileSession as FireflySession | null;
        if (!fireflySession) return;

        return TelemetryProvider.captureEvent(EventId.ACCOUNT_CONFLICT_USE_NO, {
            firefly_account_id: `${fireflySession.accountIdForEvent}`,
        });
    });
}

export async function captureMobileQrLoginClickEvent() {
    return runInSafeAsync(async () => {
        const fireflySession = useFireflyStateStore.getState().currentProfileSession as FireflySession | null;
        if (!fireflySession) return;

        return TelemetryProvider.captureEvent(EventId.MOBILE_QR_LOGIN_CLICK, {
            firefly_account_id: `${fireflySession.accountIdForEvent}`,
        });
    });
}

export async function captureMultiDeviceLoginClickEvent() {
    return runInSafeAsync(async () => {
        const fireflySession = useFireflyStateStore.getState().currentProfileSession as FireflySession | null;
        if (!fireflySession) return;

        return TelemetryProvider.captureEvent(EventId.MULTI_DEVICE_LOGIN_CLICK, {
            firefly_account_id: `${fireflySession.accountIdForEvent}`,
        });
    });
}
