import { BigNumber } from 'bignumber.js';

import { removeUSDTrailingZeros } from '@/helpers/formatMarketCap.js';

/**
 * Format USD amount with conditional rounding:
 * - When amount < 1: Round down to 2 decimal places (e.g., 0.997 -> 0.99)
 * - When amount >= 1: Round up to 2 decimal places (e.g., 1.003 -> 1.01)
 */
export function formatTokenUSDConditional(amount: BigNumber | string | number): string {
    const bn = typeof amount === 'object' && 'toNumber' in amount ? amount : BigNumber(amount);
    if (!bn || bn.isNaN() || bn.isZero()) return '$0';

    const rounded = bn.lt(1) ? bn.decimalPlaces(2, BigNumber.ROUND_FLOOR) : bn.decimalPlaces(2, BigNumber.ROUND_CEIL);

    return `$${removeUSDTrailingZeros(rounded.toFormat(2))}`;
}
