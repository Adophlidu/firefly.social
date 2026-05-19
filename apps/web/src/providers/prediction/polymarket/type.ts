import type { PredictionRecurrence } from '@/types/prediction.js';

export type PolymarketResponse<T extends object> =
    | T
    | {
          error: string;
      };

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
    bestAsk?: number;
    bestBid?: number;
    eventStartTime?: string;
}

export interface PolymarketSeries {
    id: string;
    slug: string;
    title: string;
    seriesType: string;
    recurrence: PredictionRecurrence;
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
    seriesSlug?: string;
    tags: PolymarketTag[];
    startTime?: string;
    eventMetadata?: {
        priceToBeat?: number;
        finalPrice?: number;
    };
}

export interface PolymarketPriceHistory {
    t: number;
    p: number;
}

export type PolymarketEventResponse = PolymarketResponse<PolymarketEvent>;

export type PolymarketPriceHistoryResponse = PolymarketResponse<{
    history: PolymarketPriceHistory[];
}>;

export interface UserStatsResponse {
    trades: number;
    largestWin: number;
    views: number;
    joinDate: string;
}

export type PriceHistoryInterval = '1m' | '1w' | '1d' | '6h' | '1h' | 'max';

export type PolymarketEventLocale = 'zh' | 'zh-Hant' | 'ja' | 'ko';

export interface CryptoPrice {
    cached: boolean;
    closePrice: number | null;
    completed: boolean;
    incomplete: boolean;
    openPrice: number | null;
    timestamp: number;
}

export type CryptoPriceHistory = Array<{
    timestamp: number; // milliseconds
    value: number;
}>;
