import type { MarginTableResponse } from '@nktkas/hyperliquid';

export interface SvgIconProps {
    width?: number;
    height?: number;
    stroke?: string;
}

export type PerpsMarketTab = 'favorites' | 'perps' | 'crypto' | 'stocks' | 'commodities';

export type PerpsMarketSort = 'volume' | 'priceChange' | 'openInterest';

export interface PerpsMarketTabItem {
    label: string;
    value: PerpsMarketTab;
}

export interface PerpsMarketSortItem {
    label: string;
    value: PerpsMarketSort;
}

export interface PerpsMarketItem {
    id: string;
    symbol: string;
    leverage: string;
    volumeLabel: string;
    volumeValue: number;
    priceLabel: string;
    priceChangeLabel: string;
    priceChangeValue: number;
    openInterestLabel: string;
    openInterestValue: number;
    category: Exclude<PerpsMarketTab, 'favorites'>;
    favorite?: boolean;
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

export interface PerpsDetailMarketMetaItem {
    label: string;
    value: string;
}

export interface PerpsDetailTicker {
    symbol: string;
    leverage: string;
    marketType: string;
    lastPriceLabel: string;
    usdPriceLabel: string;
    priceChangeLabel: string;
    markPriceLabel: string;
    stats: PerpsDetailMarketMetaItem[];
}

export interface PerpsOrderBookLevel {
    id: string;
    buyAmountLabel: string;
    buyPriceLabel: string;
    buyDepthRatio: number;
    sellPriceLabel: string;
    sellAmountLabel: string;
    sellDepthRatio: number;
}

export interface PerpsOrderBookPanel {
    buyLabel: string;
    sellLabel: string;
    unitLabel: string;
    levels: PerpsOrderBookLevel[];
}

export interface PerpsDetailActionButton {
    label: string;
    tone: 'buy' | 'sell';
}

export interface PerpsDetailPageData {
    ticker: PerpsDetailTicker;
    orderBook: PerpsOrderBookPanel;
    actions: PerpsDetailActionButton[];
}

// ── PerpsTradeDetail ──

export type PerpsTradeMarginMode = 'cross' | 'isolated';
export type PerpsTradeOrderType = 'market' | 'limit';
export type PerpsTradeDirection = 'buy' | 'sell';

export interface PerpsTradeDetailTicker {
    symbol: string;
    leverage: string;
    marketType: string;
    priceChangeLabel: string;
    priceChangeValue: number;
    fundingRate: string;
    countdown: string;
}

export interface PerpsTradeOrderBookEntry {
    price: string;
    amount: string;
    depthRatio: number;
}

export interface PerpsTradeOrderBook {
    asks: PerpsTradeOrderBookEntry[];
    bids: PerpsTradeOrderBookEntry[];
    lastPrice: string;
    lastPriceUsd: string;
    markPrice: string;
}

export interface PerpsTradeFormState {
    marginMode: PerpsTradeMarginMode;
    leverage: string;
    orderType: PerpsTradeOrderType;
    amount: string;
    available: string;
    reduceOnly: boolean;
    tpSlEnabled: boolean;
    sliderValue: number;
    buy: PerpsTradeEstimate;
    sell: PerpsTradeEstimate;
}

export interface PerpsTradeEstimate {
    estLiqPrice: string;
    cost: string;
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

export interface PerpsTradeDetailPageData {
    ticker: PerpsTradeDetailTicker;
    orderBook: PerpsTradeOrderBook;
    tradeForm: PerpsTradeFormState;
    positions: PerpsPositionItem[];
    openOrders: PerpsOpenOrderItem[];
    openOrdersCount: number;
}

export interface PerpsOpenOrderItem {
    id: string;
    symbol: string;
    orderTypeLabel: string;
    side: 'buy' | 'sell';
    leverageLabel?: string;
    size: string;
    filled: string;
    orderPrice: string;
    tpSl?: string;
    triggerCondition?: string;
    unfilledSize?: string;
    createdAt: string;
    priceLabel?: string;
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

// ── MarginModeSheet ──

export interface MarginModeSheetOption {
    mode: PerpsTradeMarginMode;
    title: string;
    description: string;
}

export interface MarginModeSheetData {
    currentMode: PerpsTradeMarginMode;
    options: MarginModeSheetOption[];
}

export interface MarginModeSheetQuery {
    market: string;
    currentMode: PerpsTradeMarginMode;
}

export interface SubmitMarginModeInput {
    market: string;
    mode: PerpsTradeMarginMode;
}

export interface SubmitMarginModeResult {
    success: boolean;
    message: string;
    mode: PerpsTradeMarginMode;
}

// ── LeverageSheet ──

export interface LeverageSheetData {
    symbol: string;
    currentLeverage: number;
    minLeverage: number;
    maxLeverage: number;
    step: number;
    notes: string[];
}

export interface LeverageSheetQuery {
    market: string;
    currentLeverage: number;
}

export interface SubmitLeverageInput {
    market: string;
    leverage: number;
}

export interface SubmitLeverageResult {
    success: boolean;
    message: string;
    leverage: number;
}

// ── OrderTypeSheet ──

export interface OrderTypeSheetData {
    currentType: PerpsTradeOrderType;
    options: Array<{
        value: PerpsTradeOrderType;
        label: string;
    }>;
}

export interface OrderTypeSheetQuery {
    market: string;
    currentType: PerpsTradeOrderType;
}

export interface SubmitOrderTypeInput {
    market: string;
    orderType: PerpsTradeOrderType;
}

export interface SubmitOrderTypeResult {
    success: boolean;
    message: string;
    orderType: PerpsTradeOrderType;
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

export interface TpSlSheetQuery {
    market: string;
    positionId: string;
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

// ── AccountAmountSheet ──

export type AccountAmountActionType = 'withdraw' | 'addFunds';

export interface AccountAmountSheetAction {
    type: AccountAmountActionType;
    label: string;
}

export interface AccountAmountSheetData {
    title: string;
    totalBalanceWhole: string;
    totalBalanceFraction: string;
    availableLabel: string;
    actions: AccountAmountSheetAction[];
}

export interface AccountAmountSheetQuery {
    market: string;
    available: string;
}

export interface SubmitAccountAmountActionInput {
    market: string;
    action: AccountAmountActionType;
}

export interface SubmitAccountAmountActionResult {
    success: boolean;
    message: string;
    action: AccountAmountActionType;
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
}
