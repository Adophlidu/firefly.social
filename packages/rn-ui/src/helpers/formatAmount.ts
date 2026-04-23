import { BigNumber } from 'bignumber.js';

import { isGreaterThan } from '@/helpers/number.js';
import { removeTrailingZeros } from '@/helpers/removeTrailingZeros';

export function formatAmount(
    value: BigNumber.Value,
    decimal?: number,
    roundingMode: BigNumber.RoundingMode = BigNumber.ROUND_DOWN,
) {
    if (decimal === undefined) decimal = isGreaterThan(value, 1) ? 2 : 8;
    return removeTrailingZeros(BigNumber(value).toFormat(decimal, roundingMode));
}
