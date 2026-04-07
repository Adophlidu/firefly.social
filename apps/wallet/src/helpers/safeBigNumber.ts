import { BigNumber } from 'bignumber.js';

export function safeBigNumber(value: BigNumber.Value, fallback: BigNumber.Value) {
    const n = BigNumber(value ?? 0);
    if (!n.isFinite()) return BigNumber(fallback);
    return n;
}
