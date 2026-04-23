import { BigNumber } from 'bignumber.js';

import { MAX_DECIMALS_PERPS, MAX_DECIMALS_SPOT } from '@/constants/static';

export function formatPrice(price: BigNumber.Value, szDecimals: number, isSpot = false): string {
    const bnPrice = new BigNumber(price);

    // 1. integer is always valid, no need to format
    if (bnPrice.isInteger()) {
        return bnPrice.toFixed();
    }

    // 2. max decimals
    const maxDecimals = (isSpot ? MAX_DECIMALS_SPOT : MAX_DECIMALS_PERPS) - szDecimals;

    // 3. keep 5 significant digits, and round down to avoid overestimating the price
    let formatted = new BigNumber(bnPrice.toPrecision(5, BigNumber.ROUND_DOWN)).toFixed();

    // 4. ensure the decimals do not exceed the max decimals allowed
    const currentDecimals = (formatted.split('.')[1] || '').length;
    if (currentDecimals > maxDecimals) {
        formatted = new BigNumber(formatted).toFixed(maxDecimals, BigNumber.ROUND_DOWN);
    }

    // 5. remove trailing zeros
    return new BigNumber(formatted).toFixed();
}
