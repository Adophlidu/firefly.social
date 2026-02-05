import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

// Home tab events - renamed from bets to predictions
export function captureFollowingPredictionsClick() {
    return TelemetryProvider.captureEventInSafe(EventId.EVENT_FOLLOWING_PREDICTIONS_CLICK, {});
}

export function captureExplorePredictionsClick() {
    return TelemetryProvider.captureEventInSafe(EventId.EVENT_EXPLORE_PREDICTIONS_CLICK, {});
}

export function captureExplorePredictionsCategoryClick(categoryName: string) {
    return TelemetryProvider.captureEventInSafe(EventId.EVENT_EXPLORE_PREDICTIONS_CATEGORY_CLICK, {
        category_name: categoryName,
    });
}

export function captureSearchPredictionsClick() {
    return TelemetryProvider.captureEventInSafe(EventId.EVENT_SEARCH_PREDICTIONS_CLICK, {});
}

// Polymarket event open
export function capturePolymarketEventOpenSuccess(
    eventSlug: string,
    source?:
        | 'for you'
        | 'following'
        | 'explore'
        | 'search'
        | 'predict profile detail'
        | 'wallet profile'
        | 'firefly wallet',
) {
    return TelemetryProvider.captureEventInSafe(EventId.POLYMARKET_EVENT_OPEN_SUCCESS, {
        event_slug: eventSlug,
        source,
    });
}

// Opinion event open
export function captureOpinionEventOpenSuccess(
    eventSlug: string,
    source?:
        | 'for you'
        | 'following'
        | 'explore'
        | 'search'
        | 'predict profile detail'
        | 'wallet profile'
        | 'firefly wallet',
) {
    return TelemetryProvider.captureEventInSafe(EventId.OPINION_EVENT_OPEN_SUCCESS, {
        event_slug: eventSlug,
        source,
    });
}

// Polymarket category view
export function capturePolymarketCategoryView(categorySlug: string, categoryName: string) {
    return TelemetryProvider.captureEventInSafe(EventId.POLYMARKET_CATEGORY_VIEW, {
        category_slug: categorySlug,
        category_name: categoryName,
    });
}

// Polymarket event tab click
export function capturePolymarketEventTabClick(
    eventSlug: string,
    tab: 'Order book' | 'Positions' | 'Open order' | 'Top holders' | 'Trades' | 'Info',
) {
    return TelemetryProvider.captureEventInSafe(EventId.POLYMARKET_EVENT_TAB_CLICK, {
        event_slug: eventSlug,
        tab,
    });
}

// Opinion event tab click
export function captureOpinionEventTabClick(eventSlug: string, tab: 'Top holders' | 'Trades' | 'Info') {
    return TelemetryProvider.captureEventInSafe(EventId.OPINION_EVENT_TAB_CLICK, {
        event_slug: eventSlug,
        tab,
    });
}

// Polymarket event market click
export function capturePolymarketEventMarketClick(
    eventSlug: string,
    eventTitle: string,
    marketSlug: string,
    marketTitle: string,
    marketGroupItemName?: string,
) {
    return TelemetryProvider.captureEventInSafe(EventId.POLYMARKET_EVENT_MARKET_CLICK, {
        event_slug: eventSlug,
        event_title: eventTitle,
        market_slug: marketSlug,
        market_title: marketTitle,
        market_group_item_name: marketGroupItemName,
    });
}

// Polymarket event top holder change market click
export function capturePolymarketEventTopHolderChangeMarketClick(
    eventSlug: string,
    eventTitle: string,
    marketSlug: string,
    marketTitle: string,
    marketGroupItemName: string,
) {
    return TelemetryProvider.captureEventInSafe(EventId.POLYMARKET_EVENT_TOP_HOLDER_CHANGE_MARKET_CLICK, {
        event_slug: eventSlug,
        event_title: eventTitle,
        market_slug: marketSlug,
        market_title: marketTitle,
        market_group_item_name: marketGroupItemName,
    });
}

// Polymarket event trades tab click
export function capturePolymarketEventTradesTabClick(eventSlug: string, tab: 'Global' | 'Following') {
    return TelemetryProvider.captureEventInSafe(EventId.POLYMARKET_EVENT_TRADES_TAB_CLICK, {
        event_slug: eventSlug,
        tab,
    });
}

// Polymarket profile positions event click
export function capturePolymarketProfilePositionsEventClick(parameters: {
    target_polymarket_name?: string;
    target_proxy_wallet_address: string;
    target_wallet_address?: string;
    is_firefly_user: boolean;
    target_firefly_account_id?: string;
    event_slug: string;
    market_title: string;
    outcome_name: string;
}) {
    return TelemetryProvider.captureEventInSafe(EventId.POLYMARKET_PROFILE_POSITIONS_EVENT_CLICK, parameters);
}

// Polymarket profile trades event click
export function capturePolymarketProfileTradesEventClick(parameters: {
    target_polymarket_name?: string;
    target_proxy_wallet_address: string;
    target_wallet_address?: string;
    is_firefly_user: boolean;
    target_firefly_account_id?: string;
    event_slug: string;
    market_title: string;
    outcome_name: string;
}) {
    return TelemetryProvider.captureEventInSafe(EventId.POLYMARKET_PROFILE_TRADES_EVENT_CLICK, parameters);
}

// Polymarket search event click
export function capturePolymarketSearchEventClick(eventSlug: string, eventTitle: string) {
    return TelemetryProvider.captureEventInSafe(EventId.POLYMARKET_SEARCH_EVENT_CLICK, {
        event_slug: eventSlug,
        event_title: eventTitle,
    });
}

// Opinion profile positions event click
export function captureOpinionProfilePositionsEventClick(parameters: {
    target_opinion_name?: string;
    target_proxy_wallet_address: string;
    target_wallet_address?: string;
    is_firefly_user: boolean;
    target_firefly_account_id?: string;
    event_slug: string;
    market_title: string;
    outcome_name: string;
}) {
    return TelemetryProvider.captureEventInSafe(EventId.OPINION_PROFILE_POSITIONS_EVENT_CLICK, parameters);
}

// Opinion profile trades event click
export function captureOpinionProfileTradesEventClick(parameters: {
    target_opinion_name?: string;
    target_proxy_wallet_address: string;
    target_wallet_address?: string;
    is_firefly_user: boolean;
    target_firefly_account_id?: string;
    event_slug: string;
    market_title: string;
    outcome_name: string;
}) {
    return TelemetryProvider.captureEventInSafe(EventId.OPINION_PROFILE_TRADES_EVENT_CLICK, parameters);
}

// Legacy events - kept for backward compatibility, should use renamed versions above
export function captureProfilePolymarketLinkClick() {
    return TelemetryProvider.captureEventInSafe(EventId.PROFILE_POLYMARKET_LINK_CLICK, {});
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
