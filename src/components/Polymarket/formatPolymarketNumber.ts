import { removeTrailingZeros } from '@/helpers/formatMarketCap.js';

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
    // For very small numbers, preserve their actual value instead of truncating to 0
    if (num > 0 && num < Math.pow(10, -digits)) {
        return num.toString();
    }

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
        prefix?: string | null;
        symbol?: boolean | null;
        fallback?: string | null;
        digits?: number | null;
    } = {
        prefix: '$',
        symbol: false,
        fallback: '-',
        digits: 2,
    },
) {
    const defaultPrefix = options.prefix === undefined ? '$' : options.prefix;
    const defaultSymbol = options.symbol === undefined ? false : options.symbol;
    const defaultFallback = options.fallback === undefined ? '-' : options.fallback;
    const defaultDigits = options.digits ?? 2;

    if (num === undefined || num === null) return defaultFallback ?? '';

    const isNegative = num < 0;
    const absNum = Math.abs(num);

    if (num > 0 && num < 0.0001) return `<${defaultPrefix}0.0001`;

    const match = SUFFIXES.find((s) => absNum >= s.threshold);
    const formattedNum = match
        ? formatTruncated(absNum / match.threshold, defaultDigits) + match.suffix
        : formatTruncated(absNum, defaultDigits);

    const sign = isNegative ? '-' : '';
    const symbol = defaultSymbol && num !== 0 ? (isNegative ? '-' : '+') : '';
    const prefix = defaultPrefix ?? '';

    if (defaultSymbol) {
        return `${symbol}${prefix}${formattedNum}`;
    }
    return `${sign}${prefix}${formattedNum}`;
}
