import type { ClearinghouseStateResponse, MarginTableResponse, UserFillsResponse } from '@nktkas/hyperliquid';
import type { AbstractViemJsonRpcAccount } from '@nktkas/hyperliquid/signing';
import type { ReactNode } from 'react';

export interface SvgIconProps {
    width?: number;
    height?: number;
    stroke?: string;
    size?: number;
}

export type PerpsMarketTab = 'favorites' | 'perps' | 'crypto' | 'stocks' | 'commodities';

export type PerpsMarketSort = 'volume' | 'priceChange' | 'openInterest';

export interface PerpsMarketSortItem {
    label: string;
    value: PerpsMarketSort;
}

export type TradesHistoryTab = 'trading' | 'account';

export interface TradingHistoryItem {
    id: string;
    symbol: string;
    action: string;
    price: string;
    positionSize: string;
    tradeValue: string;
    timestamp: string;
    pnl?: string;
}

export interface AccountHistoryItem {
    id: string;
    type: 'addFunds' | 'withdraw';
    title: string;
    timeAgo: string;
    amount: string;
}

// ── PerpsTradeDetail ──

export type PerpsTradeMarginMode = 'cross' | 'isolated';
export type PerpsTradeDirection = 'buy' | 'sell';

export interface PerpsTradeOrderBookEntry {
    px: string;
    sz: string;
    ratio: number;
}

export interface PerpsPositionItem {
    id: string;
    symbol: string;
    direction: PerpsTradeDirection;
    marginMode: PerpsTradeMarginMode;
    leverage: string;
    pnl: string;
    pnlPercent: string;
    pnlValue: number;
    sizeCoin: string;
    sizeUnit: string;
    margin: string;
    funding: string;
    fundingValue: number;
    entryPrice: string;
    markPrice: string;
    liqPrice: string;
    tpPrice: string;
    slPrice: string;
}

// ── ClosePositionSheet ──

export interface ClosePositionSheetData {
    symbol: string;
    currentPrice: string;
    available: string;
    leverage: string;
    receive: string;
    estClosedPnl: string;
    estClosedPnlValue: number;
}

// ── AddToPositionSheet ──

export interface AddToPositionSheetData {
    symbol: string;
    currentPrice: string;
    defaultAmount: string;
    minimumAmount: number;
    liquidationPrice: string;
    newTotal: string;
}

export interface AddToPositionSheetQuery {
    market: string;
    positionId: string;
}

export interface AddToPositionInput {
    market: string;
    positionId: string;
    amount: number;
}

export interface AddToPositionResult {
    success: boolean;
    message: string;
}

// ── TpSlSheet ──

export type TpSlValueType = 'percent';

export interface TpSlSheetData {
    symbol: string;
    entryPrice: string;
    markPrice: string;
    estimatedLiqPrice: string;
    tpPrice: string;
    tpOperator: '+';
    tpType: TpSlValueType;
    slPrice: string;
    slOperator: '-';
    slType: TpSlValueType;
}

export interface SubmitTpSlInput {
    market: string;
    positionId: string;
    tpPrice: string;
    slPrice: string;
    tpType: TpSlValueType;
    slType: TpSlValueType;
}

export interface SubmitTpSlResult {
    success: boolean;
    message: string;
}

export interface PerpsMeta {
    szDecimals: number;
    name: string;
    maxLeverage: number;
    marginTableId: number;
    onlyIsolated?: true;
    isDelisted?: true;
    marginMode?: 'strictIsolated' | 'noCross';
    growthMode?: 'enabled';
    lastGrowthModeChangeTime?: string;
    marginTable?: MarginTableResponse;
    mid?: string;
    avatar?: string;
    priceChangeValue?: number;
    dex?: string;
    dayNtlVlm?: string;
    openInterest?: string;
    priceDiff?: number;
    priceDiffRatio?: number;
}

export interface PerpAssetCtxSchema {
    prevDayPx: string;
    dayNtlVlm: string;
    markPx: string;
    midPx: string | null;
    funding: string;
    openInterest: string;
    premium: string | null;
    oraclePx: string;
    impactPxs: string[] | null;
    dayBaseVlm: string;
}

export type CoinInfo = PerpsMeta & {
    marginTable?: MarginTableResponse;
    assetCtx?: PerpAssetCtxSchema;
    index: number;
};

export interface L2BookLevel {
    px: string;
    sz: string;
    n: number;
}

export interface L2BookEvent {
    coin: string;
    time: number;
    levels: [bids: L2BookLevel[], asks: L2BookLevel[]];
    spread?: string;
}

export type WalletClient = AbstractViemJsonRpcAccount;

export interface CommonQueryOptions {
    enabled?: boolean;
    refetchInterval?: number | false;
}

export type ToastFn = (options: {
    message: ReactNode;
    type: 'success' | 'error' | 'info';
    duration?: number;
    error?: unknown;
}) => void;

export type ComputeMethod = 'ratio' | 'usd';
export type SizeInputType = 'amount' | 'usd';
export type OrderSafeType = 'reduceOnly' | 'tpSl';

export interface OpenOrder {
    coin: string;
    side: 'B' | 'A';
    limitPx: string;
    sz: string;
    oid: number;
    timestamp: number;
    origSz: string;
    triggerCondition: string;
    isTrigger: boolean;
    triggerPx: string;
    children: OpenOrder[];
    isPositionTpsl: boolean;
    reduceOnly: boolean;
    orderType: 'Market' | 'Limit' | 'Stop Market' | 'Stop Limit' | 'Take Profit Market' | 'Take Profit Limit';
    tif: 'Gtc' | 'Ioc' | 'Alo' | 'FrontendMarket' | 'LiquidationMarket' | null;
    cloid: `0x${string}` | null;
}
export type Position = ClearinghouseStateResponse['assetPositions'][number]['position'];

type PagePath = 'trade' | 'details' | 'history' | '__parent__' | 'withdraw' | 'addFunds';

export type NavigateFunc = <T extends PagePath>(
    to: T,
    options: T extends 'trade' ? { coin: string } : T extends 'details' ? { coin: string } : {},
) => void;

export type UserFill = UserFillsResponse[number];
