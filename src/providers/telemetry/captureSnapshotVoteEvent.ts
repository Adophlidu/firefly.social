import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getWalletEventParameters } from '@/providers/telemetry/getWalletEventParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

export function captureSnapshotVoteEvent(address: string) {
    return runInSafeAsync(() => {
        return TelemetryProvider.captureEvent(EventId.SNAPSHOT_VOTE_SUCCESS, getWalletEventParameters(address));
    });
}
