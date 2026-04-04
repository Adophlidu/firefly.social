import { BigNumber } from 'bignumber.js';

import { removeTrailingZeros } from '@/helpers/formatMarketCap.js';
import { isGreaterThan } from '@/helpers/number.js';

export function formatTokenItemAmount(value: BigNumber.Value, decimal?: number) {
    if (decimal === undefined) decimal = isGreaterThan(value, 1) ? 2 : 8;
    return removeTrailingZeros(BigNumber(value).toFormat(decimal, BigNumber.ROUND_DOWN));
}
