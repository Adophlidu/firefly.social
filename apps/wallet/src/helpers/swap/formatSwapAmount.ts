import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';

/**
 * Floor-truncate a number to a given number of decimal places.
 * Always rounds toward zero (never up)
 */
function floorToDecimals(num: number, decimals: number): string {
    const factor = Math.pow(10, decimals);
    const truncated = Math.floor(num * factor) / factor;
    return truncated.toFixed(decimals);
}

/**
 * Format token amount for display
 * Per Jira requirements:
 * - >= 1: 2 decimal places with thousand separators
 * - >= 0.000001: up to 6 decimal places
 * - < 0.000001: display as '<0.000001'
 *
 * Uses floor truncation (never rounds up)
 */
export function formatTokenAmount(value: string | number | undefined | null): string {
    if (value === undefined || value === null || value === '') return '0';

    const num = typeof value === 'string' ? Number.parseFloat(value) : value;

    if (isNaN(num) || num === 0) return '0';

    if (num >= 1) {
        // >= 1: 2 decimal places with thousand separators (floor)
        const fixed = floorToDecimals(num, 2);
        return Number(fixed).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    } else if (num >= 0.000001) {
        // >= 0.000001: up to 6 decimal places (floor)
        const fixed = floorToDecimals(num, 6);
        // Remove trailing zeros but keep at least one decimal if needed
        return fixed.replace(/\.?0+$/, '') || '0';
    } else {
        // < 0.000001
        return '<0.000001';
    }
}

/**
 * Format rate for display (e.g., "1 ETH ≈ 3000 USDC")
 */
export function formatRate(fromSymbol: string, toSymbol: string, rate: number): string {
    const decimals = rate >= 1 ? 2 : 6;
    const fixed = floorToDecimals(rate, decimals);
    const formattedRate = Number(fixed).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    });

    return `1 ${fromSymbol} ≈ ${formattedRate} ${toSymbol}`;
}

/**
 * Format gas estimate for display
 */
export function formatGasEstimate(gasUsd: number | undefined | null): string {
    return `~${formatTokenUSD(gasUsd ?? 0, { minDisplay: 0.01 })}`;
}

/**
 * Parse user input amount - remove thousand separators and validate
 */
export function parseInputAmount(input: string): string {
    // Remove commas and whitespace
    const cleaned = input.replace(/[,\s]/g, '');

    // Validate it's a valid number
    if (!/^\d*\.?\d*$/.test(cleaned)) return '';

    return cleaned;
}
