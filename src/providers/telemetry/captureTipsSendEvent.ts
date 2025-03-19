import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getSourceWalletEventParameters } from '@/providers/telemetry/getWalletEventParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId, type Events } from '@/providers/types/Telemetry.js';

export function captureTipsSendEvent(
    parameters: Omit<
        Events[EventId.TIPS_SEND_SUCCESS]['parameters'],
        'firefly_account_id' | 'source_wallet_type' | 'source_wallet_name'
    >,
) {
    return runInSafeAsync(() => {
        return TelemetryProvider.captureEvent(EventId.TIPS_SEND_SUCCESS, {
            ...parameters,
            ...getSourceWalletEventParameters(parameters.source_wallet_address),
        });
    });
}
