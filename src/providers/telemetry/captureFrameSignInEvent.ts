import { safeUnreachable } from '@dimensiondev/utils';

import { isFrameV1, isFrameV2 } from '@/helpers/frame.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { type Frame } from '@/types/frame.js';

const resolveEventId = (type: 'siwf' | 'auth-wallet' | 'mnemonic' | 'firefly-wallet') => {
    switch (type) {
        case 'siwf':
            return EventId.MINI_APP_FARCASTER_SIGN_IN_SUCCESS;
        case 'mnemonic':
            return EventId.MINI_APP_FIREFLY_SIGN_IN_SUCCESS;
        case 'auth-wallet':
            return EventId.MINI_APP_AUTH_WALLET_SIGN_IN_SUCCESS;
        case 'firefly-wallet':
            return EventId.MINI_APP_FIREFLY_WALLET_SIGN_IN_SUCCESS;
        default:
            safeUnreachable(type);
            throw new Error(`Unknown type: ${type}`);
    }
};

export function captureFrameSignInEvent(type: 'siwf' | 'auth-wallet' | 'mnemonic' | 'firefly-wallet', frame: Frame) {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(resolveEventId(type), {
            frame_version: (frame?.version ?? 'unknown') as string,
            frame_url: frame ? (isFrameV1(frame) ? frame.url : isFrameV2(frame) ? frame.x_url : 'unknown') : 'unknown',
            mini_app_name: isFrameV2(frame)
                ? (frame.x_manifest?.frame.name ?? frame.button.title)
                : isFrameV1(frame)
                  ? frame.title
                  : 'unknown',
        });
    });
}
