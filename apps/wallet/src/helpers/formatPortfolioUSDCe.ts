import { BigNumber } from 'bignumber.js';

import { removeUSDTrailingZeros } from '@/helpers/removeUSDTrailingZeros.js';

export function formatPortfolioUSDCe(amount: BigNumber.Value): string {
    const bn = BigNumber(amount ?? 0);
    if (!bn.isFinite() || bn.lte(0)) return '$0';
    if (bn.lt(0.01)) return '<$0.01';
    return '$' + removeUSDTrailingZeros(bn.decimalPlaces(2, BigNumber.ROUND_DOWN).toFormat(2));
}
