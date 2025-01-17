import { BigNumber } from 'bignumber.js';

export const ZERO = new BigNumber('0');
export const ONE = new BigNumber('1');

/** n === 0 */
export function isZero(n: BigNumber.Value) {
    return n === 0 || n === '0' || n === '0x0' || new BigNumber(n).isZero();
}

/** n === m */
export function isEqual(n: BigNumber.Value, m: BigNumber.Value) {
    return new BigNumber(n).isEqualTo(m);
}

/** a > b */
export function isGreaterThan(a: BigNumber.Value, b: BigNumber.Value) {
    return new BigNumber(a).isGreaterThan(b);
}

/** a >= b */
function isGreaterThanOrEqualTo(a: BigNumber.Value, b: BigNumber.Value) {
    return new BigNumber(a).isGreaterThanOrEqualTo(b);
}
export { isGreaterThanOrEqualTo, isGreaterThanOrEqualTo as isGte };

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

/** 10 ** n */
/** @deprecated use scale10 */
export function pow10(n: BigNumber.Value) {
    return new BigNumber(10).pow(n);
}

/** scale 10 ** n * m */
export function scale10(m: BigNumber.Value, n = 1) {
    const x = new BigNumber(1).shiftedBy(n);
    return n === 1 ? x : x.multipliedBy(m);
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

/** new BigNumber(n).toNumber() */
export function toNumber(value?: BigNumber.Value, fallback = 0) {
    return new BigNumber(value ?? fallback).toNumber();
}
