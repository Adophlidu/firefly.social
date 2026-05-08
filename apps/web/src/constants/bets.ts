import { PredictionPlatform } from '@/constants/enum.js';

export const MAX_MARKETS_COUNT_SELECTABLE = 4;
export const SPREAD_SETTING_OPTIONS = [0.1, 1] as const;
export const PLATFORMS_SUPPORTING_ORDER_BOOK = [PredictionPlatform.Polymarket];
export const CRYPTO_PRICE_CHART_HEIGHT = 200;

export enum PredictionCrypto {
    Bitcoin = 'bitcoin',
    Ethereum = 'ethereum',
    Solana = 'solana',
    XRP = 'xrp',
    Dogecoin = 'dogecoin',
    Hype = 'hype',
    BNB = 'bnb',
}

export enum PredictionChartType {
    PriceLine = 'price_line',
    RatioLine = 'ratio_line',
}
