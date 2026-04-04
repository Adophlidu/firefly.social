import { safeUnreachable } from '@dimensiondev/utils';

import { type ProfilePageSource, Source } from '@/constants/enum.js';
import { WatchType } from '@/providers/types/Firefly.js';

export function resolveWatchTypeToSource(watchType: WatchType): ProfilePageSource {
    switch (watchType) {
        case WatchType.Farcaster:
            return Source.Farcaster;
        case WatchType.Lens:
            return Source.Lens;
        case WatchType.Twitter:
            return Source.Twitter;
        case WatchType.Wallet:
        case WatchType.SolanaWallet:
            return Source.Wallet;
        case WatchType.MaskX:
            throw new Error('MaskX is not supported');
        default:
            safeUnreachable(watchType);
            throw new Error(`Unknown watch type: ${watchType}`);
    }
}
