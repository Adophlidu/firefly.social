import type {
    AccountAmountSheetData,
    AccountAmountSheetQuery,
    AccountHistoryItem,
    AddToPositionInput,
    AddToPositionResult,
    AddToPositionSheetData,
    AddToPositionSheetQuery,
    LeverageSheetData,
    LeverageSheetQuery,
    MarginModeSheetData,
    MarginModeSheetQuery,
    OrderTypeSheetData,
    OrderTypeSheetQuery,
    PerpsDetailPageData,
    PerpsMarketItem,
    PerpsMarketSort,
    PerpsMarketSortItem,
    PerpsMarketTab,
    PerpsMarketTabItem,
    PerpsTradeDetailPageData,
    SubmitAccountAmountActionInput,
    SubmitAccountAmountActionResult,
    SubmitLeverageInput,
    SubmitLeverageResult,
    SubmitMarginModeInput,
    SubmitMarginModeResult,
    SubmitOrderTypeInput,
    SubmitOrderTypeResult,
    SubmitTpSlInput,
    SubmitTpSlResult,
    TpSlSheetData,
    TpSlSheetQuery,
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

export interface PerpsTradeDetailPageRequest {
    market: string;
}

export interface PerpsTradeDetailPageResponse {
    data: PerpsTradeDetailPageData;
}

export type FetchPerpsTradeDetailPage = (params: PerpsTradeDetailPageRequest) => Promise<PerpsTradeDetailPageResponse>;

export interface AddToPositionSheetResponse {
    data: AddToPositionSheetData;
}

export type FetchAddToPositionSheet = (params: AddToPositionSheetQuery) => Promise<AddToPositionSheetResponse>;

export type SubmitAddToPosition = (params: AddToPositionInput) => Promise<AddToPositionResult>;

export interface MarginModeSheetResponse {
    data: MarginModeSheetData;
}

export type FetchMarginModeSheet = (params: MarginModeSheetQuery) => Promise<MarginModeSheetResponse>;

export type SubmitMarginModeChange = (params: SubmitMarginModeInput) => Promise<SubmitMarginModeResult>;

export interface LeverageSheetResponse {
    data: LeverageSheetData;
}

export type FetchLeverageSheet = (params: LeverageSheetQuery) => Promise<LeverageSheetResponse>;

export type SubmitLeverageChange = (params: SubmitLeverageInput) => Promise<SubmitLeverageResult>;

export interface OrderTypeSheetResponse {
    data: OrderTypeSheetData;
}

export type FetchOrderTypeSheet = (params: OrderTypeSheetQuery) => Promise<OrderTypeSheetResponse>;

export type SubmitOrderTypeChange = (params: SubmitOrderTypeInput) => Promise<SubmitOrderTypeResult>;

export interface TpSlSheetResponse {
    data: TpSlSheetData;
}

export type FetchTpSlSheet = (params: TpSlSheetQuery) => Promise<TpSlSheetResponse>;

export type SubmitTpSl = (params: SubmitTpSlInput) => Promise<SubmitTpSlResult>;

export interface AccountAmountSheetResponse {
    data: AccountAmountSheetData;
}

export type FetchAccountAmountSheet = (params: AccountAmountSheetQuery) => Promise<AccountAmountSheetResponse>;

export type SubmitAccountAmountAction = (
    params: SubmitAccountAmountActionInput,
) => Promise<SubmitAccountAmountActionResult>;
