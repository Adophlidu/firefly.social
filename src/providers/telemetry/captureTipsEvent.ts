import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getConnectorWalletType, getConnectorWalletName } from '@/providers/telemetry/getConnectorWalletType.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId, type Events } from '@/providers/types/Telemetry.js';

export function captureTipsEvent(
    parameters: Omit<Events[EventId.TIPS_SEND_SUCCESS]['parameters'], 'source_wallet_type' | 'source_wallet_name'>,
) {
    return runInSafeAsync(() => {
        return TelemetryProvider.captureEvent(EventId.TIPS_SEND_SUCCESS, {
            ...parameters,
            source_wallet_type: getConnectorWalletType(parameters.source_wallet_address),
            source_wallet_name: getConnectorWalletName(parameters.source_wallet_address),
        });
    });
}
