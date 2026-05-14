import type { PredictionCrypto, SPREAD_SETTING_OPTIONS } from '@/constants/bets.js';
import type { BetsMarketResolveStatus, PredictionPlatform, SocialSource } from '@/constants/enum.js';
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
    active?: boolean;
    groupItemTitle?: string;
    groupItemThreshold?: string;
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
    series?: Array<{ recurrence?: PredictionRecurrence; id: string; originalRecurrence?: PredictionRecurrence }>;
    startDate?: string;
    startTime?: string;
    endDate?: string;
    cryptoData?: {
        name: PredictionCrypto;
        priceToBeat?: number;
        finalPrice?: number;
    };
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
}
