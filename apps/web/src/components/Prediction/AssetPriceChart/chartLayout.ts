import { CRYPTO_PRICE_CHART_HEIGHT } from '@/constants/bets.js';

/** Shared chart margins — History (Recharts) and Live (liveline overlay) use the same plot box. */
export const CRYPTO_PRICE_CHART_MARGIN = { top: 8, right: 52, left: 0, bottom: 32 } as const;

export const CRYPTO_PRICE_CHART_LABEL_INSET = 6;

export function getCryptoPricePlotHeight(): number {
    return CRYPTO_PRICE_CHART_HEIGHT - CRYPTO_PRICE_CHART_MARGIN.top - CRYPTO_PRICE_CHART_MARGIN.bottom;
}
