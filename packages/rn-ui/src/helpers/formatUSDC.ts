import { BigNumber } from 'bignumber.js';

export function formatUSDC(value: BigNumber.Value) {
    const bnValue = new BigNumber(value);
    if (bnValue.isZero() || bnValue.isNaN() || !bnValue.isFinite() || value === undefined) return '$0';
    // if (bnValue.abs().lt(0.01)) return '<$0.01';

    if (bnValue.isLessThan(0)) {
        return `-$${bnValue.abs().toFormat(2)}`;
    }

    return `$${bnValue.toFormat(2)}`;
}
