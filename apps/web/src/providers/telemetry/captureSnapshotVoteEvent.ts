import { runInSafeAsync } from '@dimensiondev/utils';

import { getWalletEventParameters } from '@/providers/telemetry/getWalletEventParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import type { EventId } from '@/providers/types/Telemetry.js';

export function captureSnapshotVoteEvent(
    eventId: EventId.SNAPSHOT_VOTE_SUBMIT | EventId.SNAPSHOT_VOTE_SUCCESS,
    address: string,
) {
    return runInSafeAsync(() => {
        return TelemetryProvider.captureEvent(eventId, getWalletEventParameters(address));
    });
}
