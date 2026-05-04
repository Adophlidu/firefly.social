import { removeTrailingZeros } from '@dimensiondev/utils';
import { rightShift } from '@dimensiondev/web3/numbers';
import { BigNumber } from 'bignumber.js';

function abbreviationForZero(str: string, zeroCount: number) {
    if (zeroCount <= 1) return str;
    return str.replace(`${new Array(zeroCount).fill('0').join('')}`, `0{${zeroCount}}`);
}

export function formatMarketCap(amount: BigNumber.Value, digits = 2, symbol = '', bounded = true) {
    let bigNumber = new BigNumber(amount);
    const isNegative = bigNumber.isNegative();
    const prefix = isNegative ? '-' : '';

    if (bounded && bigNumber.gt(rightShift(1, 15))) return `>${symbol}999T`;

    const leading = `${symbol}${prefix}`;
    if (bigNumber.isGreaterThanOrEqualTo(1000)) {
        const suffixes = ['', 'K', 'M', 'B', 'T', 'P', 'E', 'Z', 'Y', 'R', 'Q'];
        let suffixIndex = 0;
        while (bigNumber.isGreaterThanOrEqualTo(1000) && suffixIndex < suffixes.length - 1) {
            bigNumber = bigNumber.dividedBy(1000);
            suffixIndex += 1;
        }

        return leading + Number.parseFloat(bigNumber.toFixed(digits)) + (suffixes[suffixIndex] ?? '');
    }
    if (bigNumber.isLessThan(1)) {
        const zeroCount = bigNumber.toFormat().substring(2).match(/^0+/)?.[0].length ?? 0;
        const format = bigNumber.toFormat(zeroCount + digits, 1);
        if (format.length >= 10) {
            return leading + abbreviationForZero(removeTrailingZeros(format), zeroCount);
        }
        return leading + removeTrailingZeros(format);
    }
    return leading + removeTrailingZeros(bigNumber.toFormat(digits));
}
