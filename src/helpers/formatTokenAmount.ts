/**
 * Format token amount according to the following rules:
 * 1. When amount >= 1:
 *    - Keep 2 decimal places
 *    - Show thousand separators
 * 2. When amount < 1:
 *    - If 1 > amount >= 0.000001, show up to 6 decimal places
 *    - If amount < 0.000001, show "<0.000001"
 */
export function formatTokenAmount(amount: string | number): string {
    const num = typeof amount === 'string' ? Number.parseFloat(amount) : amount;

    // Handle invalid input
    if (isNaN(num)) return '0';

    // When amount >= 1
    if (num >= 1) {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    // When amount < 0.000001
    if (num < 0.000001) {
        return '<0.000001';
    }

    // When 1 > amount >= 0.000001
    // Remove trailing zeros after decimal point
    return num.toFixed(6).replace(/\.?0+$/, '');
}
