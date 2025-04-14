import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getWalletEventParameters } from '@/providers/telemetry/getWalletEventParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId, type Events } from '@/providers/types/Telemetry.js';

export function captureTipsSendEvent(
    parameters: Omit<
        Events[EventId.TIPS_SEND_SUCCESS]['parameters'],
        'firefly_account_id' | 'wallet_name' | 'wallet_type'
    >,
) {
    return runInSafeAsync(() => {
        return TelemetryProvider.captureEvent(EventId.TIPS_SEND_SUCCESS, {
            ...parameters,
            ...getWalletEventParameters(parameters.wallet_address),
        });
    });
}
