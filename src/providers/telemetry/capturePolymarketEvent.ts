import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

export function capturePolymarketProfileLinkClick() {
    return TelemetryProvider.captureEventInSafe(EventId.POLYMARKET_PROFILE_DETAIL_LINK_CLICK, {});
}

export function captureProfilePolymarketLinkClick() {
    return TelemetryProvider.captureEventInSafe(EventId.PROFILE_POLYMARKET_LINK_CLICK, {});
}

export function captureFollowingPolymarketLinkClick() {
    return TelemetryProvider.captureEventInSafe(EventId.EVENT_FOLLOWING_BETS_CLICK, {});
}
