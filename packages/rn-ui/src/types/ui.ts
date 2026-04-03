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
