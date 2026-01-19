export type PolymarketResponse<T extends object> =
    | T
    | {
          error: string;
      };

export type TradedMarketsResponse = PolymarketResponse<{
    traded: number;
    user: string;
}>;

export type VolumeTradedResponse = PolymarketResponse<
    Array<{
        amount: number;
        bio: string;
        name: string;
        profileImage: string;
        profileImageOptimized: string;
        proxyWallet: string;
        pseudonym: string;
    }>
>;

export interface PolymarketHolder {
    proxyWallet: string;
    bio: string;
    asset: string;
    pseudonym: string;
    amount: number;
    displayUsernamePublic: boolean;
    outcomeIndex: number;
    name: string;
    profileImage: string;
    profileImageOptimized: string;
    verified: boolean;
}

export type TopHoldersResponse = PolymarketResponse<
    Array<{
        token: string;
        holders: PolymarketHolder[];
    }>
>;

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

export interface PolymarketPriceHistory {
    t: number;
    p: number;
}

export type PolymarketEventResponse = PolymarketResponse<PolymarketEvent>;

export type PolymarketPriceHistoryResponse = PolymarketResponse<{
    history: PolymarketPriceHistory[];
}>;

export type PriceHistoryInterval = '1m' | '1w' | '1d' | '6h' | '1h' | 'max';

export type PolymarketMarketPriceResponse = PolymarketResponse<Record<string, Record<'BUY' | 'SELL', string>>>;
