import { runInSafeAsync } from '@dimensiondev/utils';

import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { EventId } from '@/providers/types/Telemetry.js';

export async function captureTokenSyncYesEvent() {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.TOKEN_SYNC_USE_YES, {});
    });
}

export async function captureTokenSyncNoEvent() {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.TOKEN_SYNC_USE_NO, {});
    });
}

export async function captureAccountConflictYesEvent(conflict_firefly_account_id: string) {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.ACCOUNT_CONFLICT_USE_YES, {
            conflict_firefly_account_id,
        });
    });
}

export async function captureAccountConflictNoEvent(conflict_firefly_account_id: string) {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.ACCOUNT_CONFLICT_USE_NO, {
            conflict_firefly_account_id,
        });
    });
}

export async function captureMobileQrLoginClickEvent() {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.MOBILE_QR_LOGIN_CLICK, {});
    });
}

export async function captureSignInToAppClickEvent() {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.SIGN_IN_TO_APP_CLICK, {});
    });
}

export async function captureMultiDeviceLoginClickEvent() {
    return runInSafeAsync(async () => {
        const fireflySession = getSessionFromStorage(SessionType.Firefly);
        if (!fireflySession) return;

        return TelemetryProvider.captureEvent(EventId.MULTI_DEVICE_LOGIN_CLICK, {});
    });
}
