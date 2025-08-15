import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getWalletEventParameters } from '@/providers/telemetry/getWalletEventParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

export function captureSnapshotVoteEvent(
    eventId: EventId.SNAPSHOT_VOTE_SUBMIT | EventId.SNAPSHOT_VOTE_SUCCESS,
    address: string,
) {
    return runInSafeAsync(() => {
        return TelemetryProvider.captureEvent(eventId, getWalletEventParameters(address));
    });
}
