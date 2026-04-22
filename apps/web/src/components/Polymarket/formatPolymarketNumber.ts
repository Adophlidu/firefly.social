import { removeTrailingZeros } from '@/helpers/removeTrailingZeros.js';

const SUFFIXES = [
    { threshold: 1_000_000_000_000, suffix: 'T' },
    { threshold: 1_000_000_000, suffix: 'B' },
    { threshold: 1_000_000, suffix: 'M' },
    { threshold: 1_000, suffix: 'K' },
] as const;

function truncateToDecimalPlaces(num: number, digits: number): number {
    const factor = Math.pow(10, digits);
    return Math.trunc(num * factor) / factor;
}

function formatTruncated(num: number, digits: number): string {
    const truncated = truncateToDecimalPlaces(num, digits);
    let result = truncated.toString();
    const decimalIndex = result.indexOf('.');
    if (decimalIndex === -1) {
        if (digits > 0) {
            result += '.' + '0'.repeat(digits);
        }
    } else {
        const currentDecimals = result.length - decimalIndex - 1;
        if (currentDecimals < digits) {
            result += '0'.repeat(digits - currentDecimals);
        }
    }
    return removeTrailingZeros(result);
}

export function formatPolymarketNumber(
    num?: number | null,
    options: {
        symbol?: string | null;
        sign?: boolean | null;
        fallback?: string | null;
        digits?: number | null;
    } = {
        symbol: '$',
        sign: false,
        fallback: '-',
        digits: 2,
    },
) {
    const defaultSymbol = options.symbol === undefined ? '$' : options.symbol;
    const defaultSign = options.sign === undefined ? false : options.sign;
    const defaultFallback = options.fallback === undefined ? '-' : options.fallback;
    const defaultDigits = options.digits ?? 2;

    if (num === undefined || num === null) return defaultFallback ?? '';

    const isNegative = num < 0;
    const absNum = Math.abs(num);

    const symbol = defaultSymbol ?? '';
    if (num > 0 && num < 0.01) return `<${symbol}0.01`;

    const match = SUFFIXES.find((s) => absNum >= s.threshold);
    const formattedNum = match
        ? formatTruncated(absNum / match.threshold, defaultDigits) + match.suffix
        : formatTruncated(absNum, defaultDigits);

    const sign = isNegative ? '-' : '';
    const signPrefix = defaultSign && num !== 0 ? (isNegative ? '-' : '+') : '';

    if (defaultSign) {
        return `${signPrefix}${symbol}${formattedNum}`;
    }
    return `${sign}${symbol}${formattedNum}`;
}
