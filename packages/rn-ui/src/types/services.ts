import type {
    AccountHistoryItem,
    PerpsDetailPageData,
    PerpsMarketItem,
    PerpsMarketSort,
    PerpsMarketSortItem,
    PerpsMarketTab,
    PerpsMarketTabItem,
    TradingHistoryItem,
} from '@/types/ui';

export interface HistoryPageRequest {
    walletAddress: string;
    page: number;
    pageSize: number;
}

export interface TradingHistoryPageResponse {
    items: TradingHistoryItem[];
    hasMore: boolean;
}

export interface AccountHistoryPageResponse {
    items: AccountHistoryItem[];
    hasMore: boolean;
}

export interface PerpsMarketPageRequest {
    tab: PerpsMarketTab;
    sortBy: PerpsMarketSort;
    page: number;
    pageSize: number;
}

export interface PerpsMarketPageResponse {
    tabs: PerpsMarketTabItem[];
    sortOptions: PerpsMarketSortItem[];
    items: PerpsMarketItem[];
    hasMore: boolean;
}

export interface PerpsDetailPageRequest {
    market: string;
}

export interface PerpsDetailPageResponse {
    data: PerpsDetailPageData;
}

export type FetchTradingHistory = (params: HistoryPageRequest) => Promise<TradingHistoryPageResponse>;

export type FetchAccountHistory = (params: HistoryPageRequest) => Promise<AccountHistoryPageResponse>;

export type FetchPerpsMarketPage = (params: PerpsMarketPageRequest) => Promise<PerpsMarketPageResponse>;

export type FetchPerpsDetailPage = (params: PerpsDetailPageRequest) => Promise<PerpsDetailPageResponse>;
