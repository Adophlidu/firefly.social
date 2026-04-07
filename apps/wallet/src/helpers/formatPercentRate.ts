/**
 * Format a rate value (e.g. pnl_rate in [-1, +1]) into a percentage string.
 *
 * Examples:
 * - 0.1234 -> "12.34%"
 * - -0.5   -> "-50.00%"
 */
export function formatPercentRate(rate: string | number, decimals = 2): string {
    if (rate === '' || rate === null || rate === undefined) return '0%';

    const num = typeof rate === 'string' ? Number.parseFloat(rate) : rate;
    if (!Number.isFinite(num)) return '0%';

    const percent = num * 100;
    if (percent === 0) return '0%';
    const fixed = percent.toFixed(decimals);
    const trimmed = fixed.replace(/\.?0+$/, '');
    return `${trimmed}%`;
}

/**
 * Format rate into percent with a minimum display threshold.
 * Example: abs(rate*100) < 0.01 -> "<0.01%"
 */
export function formatPercentRateMin(
    rate: string | number,
    options?: {
        decimals?: number;
        minPercent?: number; // threshold in percent unit
    },
): string {
    const decimals = options?.decimals ?? 2;
    const minPercent = options?.minPercent ?? 0.01;

    if (rate === '' || rate === null || rate === undefined) return '0%';
    const num = typeof rate === 'string' ? Number.parseFloat(rate) : rate;
    if (!Number.isFinite(num)) return '0%';

    const percent = num * 100;
    const abs = Math.abs(percent);
    if (percent === 0) return '0%';
    if (abs > 0 && abs < minPercent) {
        return `${percent < 0 ? '-' : ''}<${minPercent.toFixed(decimals)}%`;
    }
    const fixed = percent.toFixed(decimals);
    const trimmed = fixed.replace(/\.?0+$/, '');
    return `${trimmed}%`;
}
