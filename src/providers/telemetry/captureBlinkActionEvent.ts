import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getWalletEventParameters } from '@/providers/telemetry/getWalletEventParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

export function captureBlinkActionEvent(address: string) {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.POST_BLINK_ACTION_SUCCESS, {
            blink_action: 'others',
            ...getWalletEventParameters(address),
        });
    });
}

export function captureBlinkActionSignMessageEvent(address: string) {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.SIGN_MESSAGE_BLINK_ACTION_SUCCESS, {
            blink_action: 'others',
            ...getWalletEventParameters(address),
        });
    });
}

export function captureBlinkAppearEvent(url: string) {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.SHOW_BLINK_ACTION, {
            blink_url: url,
        });
    });
}
