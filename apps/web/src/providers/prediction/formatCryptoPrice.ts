import type { PredictionCrypto } from '@/constants/bets.js';
import { resolveCryptoPriceDecimal } from '@/providers/prediction/resolveCryptoPriceDecimal.js';

export function formatCryptoPrice(crypto: PredictionCrypto, price: number) {
    const decimal = resolveCryptoPriceDecimal(crypto);
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: decimal, maximumFractionDigits: decimal })}`;
}
