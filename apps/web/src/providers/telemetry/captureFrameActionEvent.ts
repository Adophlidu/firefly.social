import { runInSafeAsync, safeUnreachable } from '@dimensiondev/utils';
import { ETH_ZERO_ADDRESS } from '@dimensiondev/web3/constants';
import { getAccount } from 'wagmi/actions';

import { loadWagmiClient } from '@/configs/wagmiClientLoader.js';
import { isFrameV1, isFrameV2 } from '@/helpers/frame.js';
import { getWalletEventParameters } from '@/providers/telemetry/getWalletEventParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId, type FrameActionType } from '@/providers/types/Telemetry.js';
import type { Frame } from '@/types/frame.js';

const resolveEventId = (action: FrameActionType, justSubmitted?: boolean) => {
    switch (action) {
        case 'click':
            return EventId.POST_FRAME_ACTION_CLICK;
        case 'buy':
        case 'mint':
        case 'others':
            return justSubmitted ? EventId.POST_FRAME_ACTION_SUBMIT : EventId.POST_FRAME_ACTION_SUCCESS;
        default:
            safeUnreachable(action);
            return justSubmitted ? EventId.POST_FRAME_ACTION_SUBMIT : EventId.POST_FRAME_ACTION_SUCCESS; // Fallback to a default event ID
    }
};

export function captureFrameActionEvent(
    action: FrameActionType,
    frame?: Frame,
    address?: string,
    justSubmitted?: boolean,
) {
    return runInSafeAsync(async () => {
        // Loaded on demand: frame actions are user interactions, so the heavy
        // wagmi config stays out of the feed chunks that render frames.
        const { wagmiConfig } = await loadWagmiClient();
        const walletAddress = address || getAccount(wagmiConfig)?.address || ETH_ZERO_ADDRESS;
        return TelemetryProvider.captureEvent(resolveEventId(action, justSubmitted), {
            frame_action: action,
            frame_version: (frame?.version ?? 'unknown') as string,
            frame_url: frame ? (isFrameV1(frame) ? frame.url : isFrameV2(frame) ? frame.x_url : 'unknown') : 'unknown',
            ...getWalletEventParameters(walletAddress),
        });
    });
}
