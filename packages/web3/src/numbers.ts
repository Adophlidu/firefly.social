import { BigNumber } from 'bignumber.js';

export const ZERO = new BigNumber('0');

/** n === 0 */
export function isZero(n: BigNumber.Value) {
    return n === 0 || n === '0' || n === '0x0' || new BigNumber(n).isZero();
}

/** a > b */
export function isGreaterThan(a: BigNumber.Value, b: BigNumber.Value) {
    return new BigNumber(a).isGreaterThan(b);
}

/** a >= b */
export function isGreaterThanOrEqualTo(a: BigNumber.Value, b: BigNumber.Value) {
    return new BigNumber(a).isGreaterThanOrEqualTo(b);
}

/** a < b */
export function isLessThan(a: BigNumber.Value, b: BigNumber.Value) {
    return new BigNumber(a).isLessThan(b);
}

/** a * b */
export function multipliedBy(a: BigNumber.Value, b: BigNumber.Value) {
    return new BigNumber(a).multipliedBy(b);
}

/** a + b */
export function plus(a: BigNumber.Value, b: BigNumber.Value) {
    return new BigNumber(a).plus(b);
}

/** a - b */
export function minus(a: BigNumber.Value, b: BigNumber.Value) {
    return new BigNumber(a).minus(b);
}

/** scale 10 ** n * m */
export function scale10(m: BigNumber.Value, n = 1) {
    return new BigNumber(1).shiftedBy(n).multipliedBy(m);
}

/** n * (10 ** m) */
export function rightShift(n: BigNumber.Value, m: number | undefined | null) {
    return new BigNumber(n).shiftedBy(+(m ?? 0));
}

/** n / (10 ** m) */
export function leftShift(n: BigNumber.Value, m: number | undefined | null) {
    return new BigNumber(n).shiftedBy(-(m ?? 0));
}

/** a / b */
export function dividedBy(a: BigNumber.Value, b: BigNumber.Value) {
    return new BigNumber(a).dividedBy(b);
}

export function toFixed(value: BigNumber.Value | undefined): string;
export function toFixed(value: BigNumber.Value | undefined, decimalPlaces: number): string;
export function toFixed(value: BigNumber.Value = 0, decimalPlaces?: number) {
    const n = new BigNumber(value);
    return decimalPlaces !== undefined ? n.toFixed(decimalPlaces) : n.toFixed();
}

export function safe(value: BigNumber.Value, fallback: BigNumber.Value) {
    const n = BigNumber(value ?? 0);
    if (!n.isFinite()) return BigNumber(fallback);
    return n;
}
