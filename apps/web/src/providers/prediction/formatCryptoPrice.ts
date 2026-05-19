import type { PredictionCrypto } from '@/constants/bets.js';
import { resolveCrypPriceDecimal } from '@/providers/prediction/resolveCrypPriceDecimal.js';

export function formatCryptoPrice(crypto: PredictionCrypto, price: number) {
    const decimal = resolveCrypPriceDecimal(crypto);
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: decimal, maximumFractionDigits: decimal })}`;
}
