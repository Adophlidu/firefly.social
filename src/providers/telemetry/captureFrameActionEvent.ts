import { isFrameV1, isFrameV2 } from '@/helpers/frame.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getWalletEventParameters } from '@/providers/telemetry/getWalletEventParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';
import type { Frame } from '@/types/frame.js';

export function captureFrameActionEvent(action: 'buy' | 'mint' | 'others', address: string, frame?: Frame) {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.POST_FRAME_ACTION_SUCCESS, {
            frame_action: action,
            frame_version: (frame?.version ?? 'unknown') as string,
            frame_url: frame ? (isFrameV1(frame) ? frame.url : isFrameV2(frame) ? frame.x_url : 'unknown') : 'unknown',
            ...getWalletEventParameters(address),
        });
    });
}
