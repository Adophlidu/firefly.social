export function removeTrailingZeros(str: string) {
    const result = str.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    return result === '0' ? '0' : result;
}

/**
 * Remove trailing zeros from a USD-formatted string, but always keep
 * at least 2 decimal places when the fractional part is non-zero.
 *
 * Examples:
 *   "1.00"  -> "1"       (all-zero fraction removed entirely)
 *   "1.10"  -> "1.10"    (non-zero fraction preserved with 2 digits)
 *   "1.09"  -> "1.09"    (already 2 significant decimal digits)
 *   "1.500" -> "1.50"    (extra zeros stripped, but 2 digits kept)
 *   "0.0034000" -> "0.0034" (zeros beyond significant portion removed)
 */
export function removeUSDTrailingZeros(str: string) {
    const dotIndex = str.indexOf('.');
    if (dotIndex === -1) return str;

    // Strip trailing zeros first (same as removeTrailingZeros)
    let stripped = str.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    if (stripped === '0') return '0';

    // If the stripped result has a decimal portion shorter than 2 digits, pad to 2
    const strippedDot = stripped.indexOf('.');
    if (strippedDot !== -1) {
        const decimals = stripped.length - strippedDot - 1;
        if (decimals < 2) {
            stripped = stripped + '0'.repeat(2 - decimals);
        }
    }

    return stripped;
}
