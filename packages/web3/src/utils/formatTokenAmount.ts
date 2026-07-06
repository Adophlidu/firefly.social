import { BigNumber } from 'bignumber.js';

import { isGreaterThan } from '@/numbers.js';

const DEFAULT_DUST_THRESHOLD = '0.000001';
const DEFAULT_DUST_LABEL = '<0.000001';

function removeTrailingZeros(str: string) {
    const result = str.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    return result === '0' ? '0' : result;
}

export interface FormatTokenAmountOptions {
    /** Fixed decimal places (overrides large/small split). */
    decimals?: number;
    /** Decimal places when value >= 1. Default 2. */
    largeDecimals?: number;
    /** Decimal places when value < 1. Default 6. */
    smallDecimals?: number;
    /** Label when value is below dust threshold. Default '<0.000001'. Set false to disable. */
    dustLabel?: string | false;
    /** Threshold for dust label. Default 0.000001. */
    dustThreshold?: BigNumber.Value;
    roundingMode?: BigNumber.RoundingMode;
    hasSeparators?: boolean;
    /** Use large decimals when value >= 1 (default) or only when value > 1. */
    largeWhen?: 'gte1' | 'gt1';
    /** Strip trailing zeros after formatting. Default 'smallOnly' (keep 2dp for amounts >= 1). */
    trimTrailingZeros?: boolean | 'smallOnly';
}

/**
 * Format a human-readable token amount for display.
 *
 * Default rules (swap/tips/activity surfaces):
 * - >= 1: 2 decimal places with thousand separators
 * - >= dust threshold: up to 6 decimal places
 * - below dust threshold: '<0.000001'
 */
export function formatTokenAmount(
    value: BigNumber.Value | null | undefined,
    options?: FormatTokenAmountOptions,
): string {
    if (value === null || value === undefined || value === '') return '0';

    const bn = new BigNumber(value);
    if (!bn.isFinite()) return '0';
    if (bn.isZero()) return '0';

    const {
        decimals,
        largeDecimals = 2,
        smallDecimals = 6,
        dustLabel = DEFAULT_DUST_LABEL,
        dustThreshold = DEFAULT_DUST_THRESHOLD,
        roundingMode = BigNumber.ROUND_DOWN,
        hasSeparators = true,
        largeWhen = 'gte1',
        trimTrailingZeros = 'smallOnly',
    } = options ?? {};

    const abs = bn.abs();
    const dustThresholdBn = new BigNumber(dustThreshold);

    if (
        dustLabel !== false &&
        bn.isPositive() &&
        abs.isLessThan(1) &&
        abs.isLessThan(dustThresholdBn) &&
        !abs.isZero()
    ) {
        return dustLabel;
    }

    const useLargeDecimals = largeWhen === 'gte1' ? abs.isGreaterThanOrEqualTo(1) : isGreaterThan(abs, 1);
    const decimalPlaces = decimals ?? (useLargeDecimals ? largeDecimals : smallDecimals);

    const formatted = hasSeparators
        ? abs.toFormat(decimalPlaces, roundingMode)
        : abs.toFixed(decimalPlaces, roundingMode);

    const shouldTrim = trimTrailingZeros === true || (trimTrailingZeros === 'smallOnly' && !useLargeDecimals);
    const display = shouldTrim ? removeTrailingZeros(formatted) : formatted;

    const result = bn.isNegative() ? `-${display}` : display;
    return result;
}

/** Format token list-item amounts (balances, shares) with configurable precision. */
export function formatTokenItemAmount(
    value: BigNumber.Value,
    decimal?: number,
    roundingMode: BigNumber.RoundingMode = BigNumber.ROUND_DOWN,
) {
    return formatTokenAmount(value, {
        decimals: decimal ?? (isGreaterThan(value, 1) ? 2 : 8),
        roundingMode,
        dustLabel: false,
        trimTrailingZeros: true,
    });
}
