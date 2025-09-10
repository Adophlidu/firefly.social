import { removeTrailingZeros } from '@/helpers/formatMarketCap.js';
import { isZero } from '@/helpers/number.js';

/**
 * Format USD amount according to the following rules:
 * 1. When amount >= $0.01:
 *    - Keep 2 decimal places
 *    - Show thousand separators
 * 2. When $0.01 > amount >= $0.0001:
 *    - Keep 4 decimal places
 * 3. When amount < $0.0001:
 *    - Show "<$0.0001"
 * @param amount - The USD amount to format
 */
export function formatTokenUSD(amount: string | number): string {
    if (!amount || isZero(amount)) return '$0.00';

    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '$0.00';

    if (num >= 0.01) {
        return `$${num.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        })}`;
    }

    if (num < 0.0001) {
        return '<$0.0001';
    }

    return `$${removeTrailingZeros(num.toFixed(4))}`;
}
