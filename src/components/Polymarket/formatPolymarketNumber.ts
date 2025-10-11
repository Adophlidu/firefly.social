import { removeTrailingZeros } from '@/helpers/formatMarketCap.js';

export function formatPolymarketNumber(
    num?: number,
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

    const absNum = Math.abs(num);
    const formattedNum = removeTrailingZeros(
        absNum.toLocaleString(
            'en-US',
            absNum < 1
                ? {
                      minimumSignificantDigits: defaultDigits,
                      maximumSignificantDigits: defaultDigits,
                  }
                : {
                      minimumFractionDigits: defaultDigits,
                      maximumFractionDigits: defaultDigits,
                  },
        ),
    );

    const symbol = defaultSymbol && num !== 0 ? (num < 0 ? '-' : '+') : '';
    const prefix = defaultPrefix ?? '';

    return `${symbol}${prefix}${formattedNum}`;
}
