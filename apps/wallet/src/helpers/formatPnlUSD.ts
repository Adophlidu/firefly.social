import { isZero } from '@dimensiondev/web3/numbers';
import { BigNumber } from 'bignumber.js';

import { removeUSDTrailingZeros } from '@/helpers/formatMarketCap.js';

/**
 * Format PnL USD amount:
 * - Always show a normal currency string with 2 decimals (no "<$0.0001").
 * - Never round up; always truncate (round down) to 2 decimals.
 * - Preserve sign.
 */
export function formatPnlUSD(amount: string | number): string {
    if (amount === null || amount === undefined) return '$0';
    if (isZero(amount)) return '$0';

    const bn = new BigNumber(amount);
    if (!bn.isFinite() || bn.isNaN()) return '$0';

    const sign = bn.isNegative() ? '-' : '';
    const truncated = bn.abs().decimalPlaces(2, BigNumber.ROUND_DOWN);
    const formatted = truncated.toFormat(2, BigNumber.ROUND_DOWN, {
        groupSize: 3,
        groupSeparator: ',',
        decimalSeparator: '.',
    });
    return `${sign}$${removeUSDTrailingZeros(formatted)}`;
}
