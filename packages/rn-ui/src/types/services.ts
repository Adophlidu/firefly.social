import type {
    AccountHistoryItem,
    AddToPositionInput,
    AddToPositionResult,
    SubmitTpSlInput,
    SubmitTpSlResult,
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

export type FetchTradingHistory = (params: HistoryPageRequest) => Promise<TradingHistoryPageResponse>;

export type FetchAccountHistory = (params: HistoryPageRequest) => Promise<AccountHistoryPageResponse>;

export type SubmitAddToPosition = (params: AddToPositionInput) => Promise<AddToPositionResult>;

export type SubmitTpSl = (params: SubmitTpSlInput) => Promise<SubmitTpSlResult>;
