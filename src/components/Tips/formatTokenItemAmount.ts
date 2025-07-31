import { BigNumber } from 'bignumber.js';

import { removeTrailingZeros } from '@/helpers/formatMarketCap.js';
import { isGreaterThan } from '@/helpers/number.js';

export function formatTokenItemAmount(value: BigNumber.Value) {
    if (isGreaterThan(value, 1)) {
        return removeTrailingZeros(BigNumber(value).toFormat(2, BigNumber.ROUND_DOWN));
    }
    return removeTrailingZeros(BigNumber(value).toFormat(8, BigNumber.ROUND_DOWN));
}
