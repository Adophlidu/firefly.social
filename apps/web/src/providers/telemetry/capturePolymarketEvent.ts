import { runInSafeAsync } from '@dimensiondev/utils';

import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

// Home tab events - renamed from bets to predictions
export function captureFollowingPredictionsClick() {
    return TelemetryProvider.captureEventInSafe(EventId.EVENT_FOLLOWING_PREDICTIONS_CLICK, {});
}

export function captureExplorePredictionsCategoryClick(categorySlug: string, categoryName: string) {
    return TelemetryProvider.captureEventInSafe(EventId.EVENT_EXPLORE_PREDICTIONS_CATEGORY_CLICK, {
        category_slug: categorySlug,
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
    tab: 'Order book' | 'Positions' | 'Open order' | 'Top holders' | 'Trades' | 'Info' | 'Resolution' | 'Markets',
) {
    return TelemetryProvider.captureEventInSafe(EventId.POLYMARKET_EVENT_TAB_CLICK, {
        event_slug: eventSlug,
        tab,
    });
}

// Opinion event tab click
export function captureOpinionEventTabClick(
    eventSlug: string,
    tab: 'Top holders' | 'Trades' | 'Info' | 'Resolution' | 'Markets' | 'Positions' | 'Open order',
) {
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

// Polymarket home category click
export function capturePolymarketHomeCategoryClick(categorySlug: string, categoryName: string, level: 1 | 2 | 3) {
    return TelemetryProvider.captureEventInSafe(EventId.POLYMARKET_HOME_CATEGORY_CLICK, {
        category_slug: categorySlug,
        category_name: categoryName,
        category_level: level,
    });
}

// Polymarket home sport type click
export function capturePolymarketHomeSportTypeClick(
    sportType: 'games' | 'props' | 'groups' | 'bracket',
    categorySlug: string,
) {
    return TelemetryProvider.captureEventInSafe(EventId.POLYMARKET_HOME_SPORT_TYPE_CLICK, {
        sport_market_type: sportType,
        category_slug: categorySlug,
    });
}

// Polymarket search topic click
export function capturePolymarketSearchTopicClick(categorySlug: string, categoryName: string) {
    return TelemetryProvider.captureEventInSafe(EventId.POLYMARKET_SEARCH_TOPIC_CLICK, {
        category_slug: categorySlug,
        category_name: categoryName,
    });
}

// Polymarket event crypto recurrence click
export function capturePolymarketEventCryptoRecurrenceClick(eventSlug: string, recurrenceOption: string) {
    return TelemetryProvider.captureEventInSafe(EventId.POLYMARKET_EVENT_CRYPTO_RECURRENCE_CLICK, {
        event_slug: eventSlug,
        recurrence_option: recurrenceOption,
    });
}

// Polymarket event chart change
export function capturePolymarketEventChartChange(eventSlug: string, editOption: 'time' | 'change') {
    return TelemetryProvider.captureEventInSafe(EventId.POLYMARKET_EVENT_CHART_CHANGE, {
        event_slug: eventSlug,
        edit_option: editOption,
    });
}

// Polymarket game detail Market / Live Stats / Stream option clicks
export function capturePolymarketEventMarketOptionClick(eventSlug: string) {
    return TelemetryProvider.captureEventInSafe(EventId.POLYMARKET_EVENT_MARKET_OPTION_CLICK, {
        event_slug: eventSlug,
    });
}

export function capturePolymarketEventStatsOptionClick(eventSlug: string) {
    return TelemetryProvider.captureEventInSafe(EventId.POLYMARKET_EVENT_STATS_OPTION_CLICK, {
        event_slug: eventSlug,
    });
}

export function capturePolymarketEventSteamOptionClick(eventSlug: string) {
    return TelemetryProvider.captureEventInSafe(EventId.POLYMARKET_EVENT_STEAM_OPTION_CLICK, {
        event_slug: eventSlug,
    });
}

// Polymarket order click
export function capturePolymarketOrderClick(marketSlug: string, outcome: number, source?: string) {
    return TelemetryProvider.captureEventInSafe(EventId.POLYMARKET_ORDER_CLICK, {
        market_slug: marketSlug,
        outcome,
        source,
    });
}

// Polymarket event trades profile click
export function capturePolymarketEventTradesProfileClick(
    eventSlug: string,
    targetProxyWalletAddress: string,
    targetPolymarketName?: string,
) {
    return TelemetryProvider.captureEventInSafe(EventId.POLYMARKET_EVENT_TRADES_PROFILE_CLICK, {
        event_slug: eventSlug,
        target_proxy_wallet_address: targetProxyWalletAddress,
        target_polymarket_name: targetPolymarketName,
    });
}

// Opinion event trades profile click
export function captureOpinionEventTradesProfileClick(
    eventSlug: string,
    targetProxyWalletAddress: string,
    targetOpinionName?: string,
) {
    return TelemetryProvider.captureEventInSafe(EventId.OPINION_EVENT_TRADES_PROFILE_CLICK, {
        event_slug: eventSlug,
        target_proxy_wallet_address: targetProxyWalletAddress,
        target_opinion_name: targetOpinionName,
    });
}
