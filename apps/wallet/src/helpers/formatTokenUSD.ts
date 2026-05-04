import { removeTrailingZeros } from '@dimensiondev/utils';
import { isZero } from '@dimensiondev/web3/numbers';
import { BigNumber } from 'bignumber.js';

import { removeUSDTrailingZeros } from '@/helpers/removeUSDTrailingZeros.js';

export interface FormatTokenUSDOptions {
    /** When true, drop decimals for amounts >= 1 */
    integerWhenGte1?: boolean;
    /** When set, amounts > 0 but below this threshold display as `<$X.XX` */
    minDisplay?: number;
}

/**
 * Format USD amount according to the following rules:
 * 1. When amount >= $0.01:
 *    - Keep 2 decimal places
 *    - Show thousand separators
 * 2. When $0.01 > amount >= $0.0001:
 *    - Keep 4 decimal places
 * 3. When amount < $0.0001:
 *    - Show "<$0.0001"
 *
 * With integerWhenGte1 option:
 * - When amount >= 1: show integer only (no decimals)
 * - When amount < 1: keep 2 decimal places
 *
 * @param amount - The USD amount to format
 * @param options - Formatting options
 */
export function formatTokenUSD(amount: string | number, options?: FormatTokenUSDOptions): string {
    if (!amount || isZero(amount)) return '$0';

    const bn = new BigNumber(amount);
    if (!bn.isFinite()) return '$0';

    const abs = bn.abs();
    const sign = bn.isNegative() ? '-' : '';

    if (options?.minDisplay !== undefined && abs.gt(0) && abs.lt(options.minDisplay)) {
        return `${sign}<$${new BigNumber(options.minDisplay).toFixed()}`;
    }

    if (options?.integerWhenGte1) {
        if (abs.gte(1)) {
            const formatted = abs.decimalPlaces(0, BigNumber.ROUND_DOWN).toFormat(0);
            return `${sign}$${formatted}`;
        }
        const formatted = abs.decimalPlaces(2, BigNumber.ROUND_DOWN).toFixed(2);
        return `${sign}$${removeUSDTrailingZeros(formatted)}`;
    }

    if (bn.gte(0.01)) {
        // Truncate to 2 decimals (no rounding), keep thousands separators.
        const text = bn.decimalPlaces(2, BigNumber.ROUND_DOWN).toFormat(2);
        return `$${removeUSDTrailingZeros(text)}`;
    }

    if (bn.lt(0.0001)) {
        return '<$0.0001';
    }

    // Truncate to 4 decimals (no rounding).
    const text = bn.decimalPlaces(4, BigNumber.ROUND_DOWN).toFixed(4);
    return `$${removeTrailingZeros(text)}`;
}
