import { PredictionPlatform } from '@dimensiondev/enums';

export const MAX_MARKETS_COUNT_SELECTABLE = 4;
export const SPREAD_SETTING_OPTIONS = [0.1, 1] as const;
export const PLATFORMS_SUPPORTING_ORDER_BOOK = [PredictionPlatform.Polymarket];
export const CRYPTO_PRICE_CHART_HEIGHT = 200;
export const P_USDC_POLYGON_ADDRESS = '0xc011a7e12a19f7b1f670d46f03b03f3342e82dfb';

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
