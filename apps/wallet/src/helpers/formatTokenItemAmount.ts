import { isGreaterThan } from '@dimensiondev/web3/numbers';
import { BigNumber } from 'bignumber.js';

import { removeTrailingZeros } from '@dimensiondev/utils';

export function formatTokenItemAmount(
    value: BigNumber.Value,
    decimal?: number,
    roundingMode: BigNumber.RoundingMode = BigNumber.ROUND_DOWN,
) {
    if (decimal === undefined) decimal = isGreaterThan(value, 1) ? 2 : 8;
    return removeTrailingZeros(BigNumber(value).toFormat(decimal, roundingMode));
}
