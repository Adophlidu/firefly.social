/**
 * Format price (0-1 range) to cents.
 * @param price - The price value (0-1)
 * @param decimals - Number of decimal places to truncate to (default: 2)
 */
export function formatPriceToCents(price: unknown, decimals = 2): string {
    const n = typeof price === 'string' ? Number.parseFloat(price) : typeof price === 'number' ? price : NaN;
    if (!Number.isFinite(n)) return '-';
    const cents = n * 100;
    // Round half-up to specified decimals, then trim trailing zeros.
    const factor = Math.pow(10, decimals);
    const floored = Math.round(cents * factor) / factor;
    const text = floored.toFixed(decimals).replace(/\.?0+$/, '');
    return `${text}¢`;
}
