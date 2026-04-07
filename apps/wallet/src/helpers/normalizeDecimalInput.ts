export interface NormalizeDecimalInputOptions {
    /**
     * Maximum number of digits after the decimal point.
     * Example: 1 allows `12.3` but turns `12.34` into `12.3`.
     */
    maxDecimals: number;
    /**
     * Clamp numeric value to this minimum (inclusive).
     * If omitted, no minimum clamp is applied.
     */
    min?: number;
    /**
     * Clamp numeric value to this maximum (inclusive).
     * If omitted, no maximum clamp is applied.
     */
    max?: number;
    /**
     * Preserve a trailing dot while typing (e.g. `1.`).
     * Default: true
     */
    preserveTrailingDot?: boolean;
}

/**
 * Normalizes a decimal input string for controlled inputs.
 *
 * - Strips non-numeric characters (keeps digits and a single dot)
 * - Limits fraction digits to `maxDecimals`
 * - Optionally preserves a trailing dot (e.g. `1.`) while typing
 * - Optionally clamps numeric value to [min, max]
 *
 * Note: This is intended for UI input sanitation, not for financial rounding.
 */
export function normalizeDecimalInput(input: string, options: NormalizeDecimalInputOptions) {
    const { maxDecimals, min, max, preserveTrailingDot = true } = options;
    const raw = input ?? '';
    if (raw === '') return '';

    // Keep digits and the first dot only.
    const cleaned = raw.replace(/[^\d.]/g, '');
    const firstDot = cleaned.indexOf('.');
    const normalized =
        firstDot === -1 ? cleaned : cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');

    const [intPartRaw = '', fracRaw = ''] = normalized.split('.');
    const hasDot = normalized.includes('.');
    const frac = maxDecimals > 0 ? fracRaw.slice(0, maxDecimals) : '';

    // Remove leading zeros while keeping "0" and allowing intermediate empty.
    const intPart = intPartRaw.replace(/^0+(?=\d)/, '') || (intPartRaw === '' ? '' : '0');

    // Preserve "1." while typing.
    if (preserveTrailingDot && hasDot && frac === '' && normalized.endsWith('.')) return `${intPart || '0'}.`;

    const candidate = hasDot ? `${intPart || '0'}.${frac}` : intPart;
    const n = Number(candidate);
    if (!Number.isFinite(n)) return '';

    const clampedMin = typeof min === 'number' && Number.isFinite(min) ? min : undefined;
    const clampedMax = typeof max === 'number' && Number.isFinite(max) ? max : undefined;
    let clamped = n;
    if (clampedMin !== undefined) clamped = Math.max(clampedMin, clamped);
    if (clampedMax !== undefined) clamped = Math.min(clampedMax, clamped);

    // If no dot in the user's input, keep it integer-like.
    if (!hasDot) return String(Math.trunc(clamped));

    // Keep at most `maxDecimals` digits; if user typed a dot but no fraction, avoid forcing trailing zeros.
    if (maxDecimals <= 0) return String(Math.trunc(clamped));
    return frac ? clamped.toFixed(Math.min(maxDecimals, frac.length)) : String(Math.trunc(clamped));
}
