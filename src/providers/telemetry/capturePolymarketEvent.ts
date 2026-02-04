import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

export function captureProfilePolymarketLinkClick() {
    return TelemetryProvider.captureEventInSafe(EventId.PROFILE_POLYMARKET_LINK_CLICK, {});
}

export function captureFollowingPolymarketLinkClick() {
    return TelemetryProvider.captureEventInSafe(EventId.EVENT_FOLLOWING_BETS_CLICK, {});
}

// Polymarket/Opinion profile click events with detailed parameters

interface BasePredictionProfileClickParams {
    target_proxy_wallet_address: string;
    target_wallet_address?: string;
    is_firefly_user: boolean;
    target_firefly_account_id?: string;
}

interface PolymarketProfileClickParams extends BasePredictionProfileClickParams {
    target_polymarket_name?: string;
}

interface OpinionProfileClickParams extends BasePredictionProfileClickParams {
    target_opinion_name?: string;
}

export function capturePolymarketProfileDetailClick(params: PolymarketProfileClickParams) {
    return runInSafeAsync(() => {
        return TelemetryProvider.captureEvent(EventId.PROFILE_WALLET_POLYMARKET_PROFILE_CLICK, params);
    });
}

export function captureOpinionProfileDetailClick(params: OpinionProfileClickParams) {
    return runInSafeAsync(() => {
        return TelemetryProvider.captureEvent(EventId.PROFILE_WALLET_OPINION_PROFILE_CLICK, params);
    });
}
