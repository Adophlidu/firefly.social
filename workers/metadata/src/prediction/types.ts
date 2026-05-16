export type PolymarketResponse<T extends object> =
    | T
    | {
          error: string;
      };

export interface PolymarketMarket {
    id: string;
    question: string;
    conditionId: string;
    slug: string;
    startDate?: string;
    endDate: string;
    createdAt: string;
    liquidity: string;
    image: string;
    icon: string;
    description: string;
    outcomes: string;
    outcomePrices: string;
    volume: string;
    active: boolean;
    closed: boolean;
    new: boolean;
    negRisk: boolean;
    umaResolutionStatus: string;
    umaResolutionStatuses: string;
    groupItemTitle: string;
    groupItemThreshold: string;
    clobTokenIds: string;
    oneDayPriceChange: string;
    oneWeekPriceChange: string;
    events: PolymarketEvent[];
    orderPriceMinTickSize: string;
    bestAsk?: number;
    bestBid?: number;
}

export interface PolymarketSeries {
    id: string;
    slug: string;
    title: string;
    seriesType: string;
    recurrence: string;
    image: string;
    icon: string;
    active: boolean;
    closed: boolean;
    archived: boolean;
    new: boolean;
    publishedAt: string;
    createdAt: string;
    updatedAt: string;
    volume: string;
    liquidity: string;
    startDate: string;
}

export interface PolymarketTag {
    id: string;
    label: string;
    slug: string;
    forceShow: boolean;
    publishedAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface PolymarketEvent {
    id: string;
    slug: string;
    title: string;
    description: string;
    startDate: string;
    creationDate: string;
    endDate: string;
    image: string;
    icon: string;
    active: boolean;
    closed: boolean;
    archived: boolean;
    new: boolean;
    liquidity: string;
    volume: string;
    openInterest: string;
    createdAt: string;
    updatedAt: string;
    negRisk: boolean;
    sortBy: string;
    markets: PolymarketMarket[];
    series: PolymarketSeries[];
    tags: PolymarketTag[];
}

export type PolymarketEventResponse = PolymarketResponse<PolymarketEvent>;

export interface OpinionMarketDetail {
    title: string;
    titleShort: string;
    topicId: number;
    totalPrice: string;
    volume: string;
    volume7d: string;
    volume24h: string;
    /**
     * 4-resolved, 3-resolving, 2-activated, else-created
     */
    status: number;
    thumbnailUrl: string;
    cutoffTime: number;
    yesLabel: string;
    yesMarketPrice: string;
    yesPos: string;
    yesRemainToken: string;
    noLabel: string;
    noMarketPrice: string;
    noPos: string;
    noRemainToken: string;
    conditionId: string;
    rules: string;
    questionId: string;
    resultPos: string;
    createTime: number; // timestamp in seconds
    childList?: Array<Omit<OpinionMarketDetail, 'childList'>>;
}

export enum PredictionPlatform {
    Polymarket = 'polymarket',
    Opinion = 'opinion',
}

export interface PolymarketProfileData {
    balance: number;
    buy_count: number;
    cash_balance: number;
    gains: number;
    join1year: string;
    join_time: number;
    losses: number;
    notfill_balance: number;
    notfill_pnl: number;
    pnl: number;
    pnl1m: string;
    pnl100: string;
    pnl_rate: number;
    position_traded: number;
    proxy: string;
    sell_count: number;
    shares: number;
    total_count: number;
    wallet: string;
    win_rate: number;
    win_rate67: string;
    platform_avatar: string;
    platform_name: string;
}

export interface BetPortfolioItem {
    platform: PredictionPlatform;
    wallet: string;
    proxy: string;
    /** url */
    platform_avatar: string;
    platform_name: string;
    pnl: number;
    cash_balance: number;
    balance: number;
    notfill_balance: number;
    volume?: number;
}

export interface BetsMarketOutcome {
    id: string;
    label: string;
    price: string;
    rate?: string;
    bestAsk?: string;
    bestBid?: string;
}

export interface BetsMarketResolveStatus {
    outcomeId: string;
    status: string;
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
    // Additional fields for BetItem compatibility
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
    // Additional fields for BetItem compatibility
    slug?: string;
    icon?: string;
    closed?: boolean;
    archived?: boolean;
    sortBy?: string;
    series?: Array<{ recurrence?: string }>;
    startDate?: string;
}
