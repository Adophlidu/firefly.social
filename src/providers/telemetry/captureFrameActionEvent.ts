import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getWalletEventParameters } from '@/providers/telemetry/getWalletEventParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';
import type { ActionType } from '@/types/frame.js';

export function captureFrameActionEvent(action: ActionType, address: string) {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.POST_FRAME_ACTION_SUCCESS, {
            action_type: action,
            frame_action: 'others',
            ...getWalletEventParameters(address),
        });
    });
}
