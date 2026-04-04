import { PredictionPlatform, type SocialSource, type Source } from '@/constants/enum.js';
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
