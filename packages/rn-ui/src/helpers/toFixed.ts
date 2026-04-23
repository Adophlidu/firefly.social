import { BigNumber } from 'bignumber.js';

import { removeTrailingZeros } from '@/helpers/removeTrailingZeros';

export function toFixed(
    value: number | string,
    decimals: number,
    options?: {
        removeExtraZeros?: boolean;
        roundingMode?: BigNumber.RoundingMode;
    },
) {
    const num = BigNumber(value);
    if (num.isNaN()) return '0';

    const { removeExtraZeros = true, roundingMode = BigNumber.ROUND_DOWN } = options || {};
    const fixed = num.toFixed(decimals, roundingMode);

    return removeExtraZeros ? removeTrailingZeros(fixed) : fixed;
}
