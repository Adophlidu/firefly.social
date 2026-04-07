import { safeUnreachable } from '@dimensiondev/utils';
import { BigNumber } from 'bignumber.js';

import { normalizeDecimalInput } from '@/helpers/normalizeDecimalInput.js';

export type BetInputType = 'usd' | 'shares' | 'limitPriceCents';

function trimTrailingDecimalZeros(v: string) {
    // Preserve intermediate typing like "0." / "1."
    if (!v.includes('.') || v.endsWith('.')) return v;
    // Trim trailing zeros in fractional part, and drop the dot if nothing remains.
    const trimmed = v.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    return trimmed;
}

/**
 * Normalize numeric inputs used in Bet UIs.
 *
 * - `usd` / `shares`: allow up to 2 decimals
 * - `limitPriceCents`: allow up to `maxDecimals` decimals (default 1), clamped to [0, max]
 */
export function normalizeBetInput(raw: string, type: BetInputType, options?: { maxDecimals?: number; max?: number }) {
    switch (type) {
        case 'usd':
        case 'shares':
            return trimTrailingDecimalZeros(normalizeDecimalInput(raw, { maxDecimals: 2, min: 0 }));
        case 'limitPriceCents':
            // IMPORTANT: this must be "round down" (floor), not JS `toFixed` rounding.
            // We keep the user's typed precision, clamp to [0, max], then floor to `maxDecimals`.
            // (Used by Limit forms; rounding up can cause price to exceed user intent / min tick.)
            return (() => {
                const maxDecimals = Math.max(0, options?.maxDecimals ?? 1);
                const max = Number.isFinite(options?.max as number) ? Number(options?.max) : 99.9;

                const input = raw ?? '';
                if (input === '') return '';

                // Keep digits and the first dot only (same behavior as normalizeDecimalInput).
                const cleaned = input.replace(/[^\d.]/g, '');
                const firstDot = cleaned.indexOf('.');
                const normalized =
                    firstDot === -1
                        ? cleaned
                        : cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');

                const [intPartRaw = '', fracRaw = ''] = normalized.split('.');
                const hasDot = normalized.includes('.');
                const frac = maxDecimals > 0 ? fracRaw.slice(0, maxDecimals) : '';
                const intPart = intPartRaw.replace(/^0+(?=\d)/, '') || (intPartRaw === '' ? '' : '0');

                const candidate = hasDot && maxDecimals > 0 && frac ? `${intPart || '0'}.${frac}` : `${intPart || '0'}`;

                const n = BigNumber(candidate);
                if (!n.isFinite()) return '';

                const clamped = BigNumber.min(BigNumber(max), BigNumber.max(0, n));
                const floored = clamped.decimalPlaces(maxDecimals, BigNumber.ROUND_FLOOR);
                const fixed = maxDecimals > 0 ? floored.toFixed(maxDecimals) : floored.toFixed(0);
                return trimTrailingDecimalZeros(fixed);
            })();
        default:
            safeUnreachable(type);
            return '';
    }
}
