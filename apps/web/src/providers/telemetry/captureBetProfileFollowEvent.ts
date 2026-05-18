import { PredictionPlatform } from '@dimensiondev/enums';
import type { SocialSource, Source } from '@dimensiondev/enums';

import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

export function captureBetProfileFollowEvent(
    platform: PredictionPlatform,
    followType: SocialSource | Source.Wallet | 'login' | 'proxy_wallet',
) {
    return TelemetryProvider.captureEventInSafe(
        platform === PredictionPlatform.Polymarket
            ? EventId.POLYMARKET_PROFILE_FOLLOW_CLICK
            : EventId.OPINION_PROFILE_FOLLOW_CLICK,
        {
            follow_type: followType,
        },
    );
}
