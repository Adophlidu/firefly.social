import { formatTokenAmount as formatDisplayTokenAmount } from '@dimensiondev/web3/utils';

import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';

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
    return formatDisplayTokenAmount(value);
}

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
 * Parse user input amount - remove thousand separators, validate, and strip leading zeros.
 *
 * Examples: `000` → `0`, `01.5` → `1.5`, `0.5` → `0.5`, `0.` → `0.`, `.5` → `.5`.
 */
export function parseInputAmount(input: string): string {
    // Remove commas and whitespace
    const cleaned = input.replace(/[,\s]/g, '');

    // Validate it's a valid number
    if (!/^\d*\.?\d*$/.test(cleaned)) return '';

    const dotIndex = cleaned.indexOf('.');
    const intPart = dotIndex === -1 ? cleaned : cleaned.slice(0, dotIndex);
    const fracPart = dotIndex === -1 ? '' : cleaned.slice(dotIndex);
    const strippedInt = intPart.replace(/^0+(?=\d)/, '');
    return strippedInt + fracPart;
}
