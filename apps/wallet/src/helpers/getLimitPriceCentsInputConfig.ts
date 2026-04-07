import { BigNumber } from 'bignumber.js';

export interface LimitPriceCentsInputConfig {
    /** Allowed decimals for the cents (¢) input */
    maxDecimals: number;
    /** Step size for +/- and `<input step>` (in cents). */
    step: string;
    /** Max allowed value for the cents (¢) input */
    max: string;
}

/**
 * Given Polymarket `orderPriceMinTickSize` (in dollars), derive the Limit Price (¢) input precision.
 *
 * Rule:
 * - tick has `n` decimals → cents input allows `max(0, n - 2)` decimals.
 *
 * Examples:
 * - tick 0.01  (n=2) → maxDecimals 0 → step 1 → max 99
 * - tick 0.001 (n=3) → maxDecimals 1 → step 1 → max 99.9
 *
 * Note:
 * - The UI +/- step is intentionally kept at 1¢ (does NOT follow tick size).
 */
export function getLimitPriceCentsInputConfig(orderPriceMinTickSize?: number | null): LimitPriceCentsInputConfig {
    // Polymarket provides tick size in **dollars** (e.g. 0.001).
    // Use string conversion to avoid JS float artifacts (0.001 -> 0.001000000000...).
    const tick = new BigNumber(
        orderPriceMinTickSize !== null && orderPriceMinTickSize !== undefined ? String(orderPriceMinTickSize) : '0.01',
    );
    const safeTick = tick.isFinite() && tick.gt(0) ? tick : new BigNumber('0.01');
    const tickDecimals = safeTick.decimalPlaces() ?? 2;
    const maxDecimals = Math.max(0, tickDecimals - 2);

    // Keep +/- step fixed at 1¢ regardless of tick size. Users can still type decimals when maxDecimals > 0.
    const step = new BigNumber(1);

    // Keep price strictly below 100¢ (i.e. < $1).
    // max = 100 - 10^{-maxDecimals}  => 99, 99.9, 99.99, ...
    const denom = new BigNumber(10).pow(maxDecimals);
    const max = new BigNumber(100).minus(new BigNumber(1).div(denom));

    return {
        maxDecimals,
        step: step.toString(),
        max: max.toString(),
    };
}
