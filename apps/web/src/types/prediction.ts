import type { BetsMarketResolveStatus, PredictionPlatform, SocialSource } from '@dimensiondev/enums';

import type { PredictionCrypto, SPREAD_SETTING_OPTIONS } from '@/constants/bets.js';
import type { PolymarketOpenOrderDetail } from '@/providers/types/Firefly.js';

export type MarketOrderBookSpread = (typeof SPREAD_SETTING_OPTIONS)[number];

export interface PredictionPnlHistoryItem {
    timestamp: number;
    pnl: number;
}

export interface PredictionPnlHistory {
    pnl_items: PredictionPnlHistoryItem[];
    net_pnl: number;
    net_pnl_rate: number;
}

export interface PredictionProfileDataForUI {
    balance: number;
    cash_balance: number;
    notfill_balance: number;
    platform_name: string;
    platform_avatar: string;
    pnl: number;
    proxy: string;
    wallet: string;
    tags?: string[];
    position_traded?: number;
    win_rate?: number;
    losses?: number;
    gains?: number;
    volume?: number;
    pnl_history?: PredictionPnlHistory;
    pnl_rate?: number;
    largest_win?: number;
}

export interface PredictionPositionDataForUI {
    parent_title?: string;
    title?: string;
    vote_status: string;
    event_slugs: string[];
    marketSlug: string;
    Id: string;
    image?: string;
    shares: number;
    avg_price: number;
    cur_price: number;
    pnl: number;
    pnl_rate: number;
    total_buy: number;
    IsClaim: boolean;
    is_closed: boolean;
    closed_time?: number | null;
    endDate?: string;
    endTime?: string;
    topicId?: number;
    is_mutil?: number;
    isClaimable?: boolean;
    isWin?: boolean;
    conditionId: string;
    resolvedResult?: string;
    outcomeIndex?: number;
    /**
     * calculated at runtime: .cur_price * .shares
     */
    current_value?: number;
}

export interface BetsMarketOutcome {
    id: string;
    label: string;
    price: string;
    rate?: string;
    bestAsk?: string;
    bestBid?: string;
    slug?: string;
}

export interface BetsMarketDataForUI {
    id: string;
    conditionId: string;
    questionId: string;
    title: string;
    volume: string;
    isResolved: boolean;
    isClosed: boolean;
    createTime: number;
    resolvedOutcomeId?: string;
    slug?: string;
    image?: string;
    outcomes: BetsMarketOutcome[];
    statusList?: BetsMarketResolveStatus[];
    bestAsk?: number;
    bestBid?: number;
    question?: string;
    description?: string;
    active?: boolean;
    groupItemTitle?: string;
    groupItemThreshold?: string;
    /** Sport fields */
    sportsMarketType?: string;
    line?: number;
    groupTypeFF?: SportMarketGroupType;
    closedTime?: number;
    originalMoneylineMarkets?: BetsMarketDataForUI[];
}

export interface BetsEventTagForUI {
    id: string;
    label: string;
    slug?: string;
}

export interface BetsEventDataForUI {
    id: string;
    title: string;
    image?: string;
    endTime: number;
    isSingleEvent: boolean;
    platform: PredictionPlatform;
    status: 'active' | 'ended';
    markets: BetsMarketDataForUI[];
    tags?: BetsEventTagForUI[];
    description?: string;
    volume: string;
    slug?: string;
    icon?: string;
    closed?: boolean;
    archived?: boolean;
    sortBy?: string;
    series?: Array<{
        recurrence?: PredictionRecurrence;
        id: string;
        slug?: string;
        originalRecurrence?: PredictionRecurrence;
    }>;
    startDate?: string;
    startTime?: string;
    endDate?: string;
    cryptoData?: {
        name: PredictionCrypto;
        recurrence?: PredictionRecurrence;
        priceToBeat?: number;
        finalPrice?: number;
    };
    sportData?: SportEventData;
}

export interface BetsTopHolderForUI {
    wallet: string;
    shares: number;
    name?: string;
    avatar?: string;
    source?: SocialSource;
}

export type BetsMarketWithSettings = Omit<BetsMarketDataForUI, 'outcomes'> & {
    color: string;
    selected: boolean;
    totalPrice: number;
    outcomes: Array<
        BetsMarketDataForUI['outcomes'][number] & {
            color: string;
        }
    >;
};

export interface BetsOrderBookItem {
    price: number;
    size: number;
}

export type PredictionOpenOrder = PolymarketOpenOrderDetail;

export enum PredictionRecurrence {
    FiveMinutes = '5m',
    FifteenMinutes = '15m',
    FourHours = '4h',
    Daily = 'daily',
    Hour = 'hourly',
}

export interface SportTeam {
    id?: number;
    name?: string;
    abbreviation?: string;
    /** Alternate name from Polymarket (e.g. "Bosnia-Herzegovina" when name is "Bosnia and Herzegovina"). */
    alias?: string;
    logo?: string;
    color?: string;
    record?: string;
}

export interface SportScore {
    score?: number[];
    /** Tennis tie-break points for each side, rendered as score superscripts. */
    memo?: number[];
}

/**
 * Per-kick result in a penalty shootout.
 * - 0 = pending (not yet taken)
 * - 1 = scored
 * - 2 = missed
 */
export type PenaltyKickOutcome = 0 | 1 | 2;

/**
 * Penalty-shootout data. `home`/`away` are ordered per-kick results in kick order,
 * one entry per kick taken (or pending slot) for that side. Presence of this object
 * signals the match is in (or finished via) a shootout.
 */
export interface PenaltyShootout {
    home: PenaltyKickOutcome[];
    away: PenaltyKickOutcome[];
}

export enum SportScoreType {
    Unknown = 0,
    Single = 1,
    Multiple = 2,
}

export interface SportLiveStreamInfo {
    livestreamUrl?: string;
    inWhiteList?: boolean;
    playerUrl?: string;
}

export interface SportEventData {
    gameId: number;
    live: boolean;
    ended: boolean;
    homeTeam: SportTeam;
    awayTeam: SportTeam;
    scores: SportScore[];
    scoreType: SportScoreType;
    period?: string;
    /** Per-kick penalty-shootout results. Presence ⇒ match is in/finished via a shootout. */
    penaltyShootout?: PenaltyShootout;
    startTime?: string;
    livestreamInfo?: SportLiveStreamInfo;
    winResult?: number;
    isDraw: boolean;
    /** Raw league identifier from `/v1/polymarket/event/detail` (e.g. `fifwc` for the FIFA World Cup). */
    leagueId?: string;
    leagueName?: string;
    leagueSlug?: string;
    spreadsMainLine?: number;
    totalsMainLine?: number;
    sportCategory?: SportCategory;
    /**
     * Child event IDs under this sport event (e.g. series games / prop sub-events).
     * A user's position may live on a child event, so position lookups must batch
     * the parent id with these (matches iOS) — querying the parent alone misses them.
     */
    childEventIds?: string[];
}

export enum SportCategory {
    Default = 'default',
    Soccer = 'soccer',
    Tennis = 'tennis',
    Baseball = 'baseball',
    EsportDota2 = 'esport_dota2',
    EsportValorant = 'esport_valorant',
    EsportCs2 = 'esport_cs2',
    EsportLol = 'esport_lol',
}

export enum SportMarketGroupType {
    Moneyline = 'moneyline',
    Spread = 'spread',
    Total = 'total',
    Other = 'other',
}
