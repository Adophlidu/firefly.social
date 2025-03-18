import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getConnectorWalletType, getConnectorWalletName } from '@/providers/telemetry/getConnectorWalletType.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId, type Events } from '@/providers/types/Telemetry.js';

export function captureSnapshotVoteEvent(
    parameters: Omit<
        Events[EventId.SNAPSHOT_VOTE_SUCCESS]['parameters'],
        'firefly_account_id' | 'wallet_type' | 'wallet_name'
    >,
) {
    return runInSafeAsync(() => {
        return TelemetryProvider.captureEvent(EventId.SNAPSHOT_VOTE_SUCCESS, {
            ...parameters,
            wallet_type: getConnectorWalletType(parameters.wallet_address),
            wallet_name: getConnectorWalletName(parameters.wallet_address),
        });
    });
}
