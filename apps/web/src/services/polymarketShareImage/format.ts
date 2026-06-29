/** Number formatting for the share images (FW-7696). */

export function formatUsd(value: number): string {
    const amount = Math.abs(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return value < 0 ? `-$${amount}` : `$${amount}`;
}

/** Like {@link formatUsd} but with an explicit "+" sign for non-negative values (e.g. "+$893.34"). */
export function formatSignedUsd(value: number): string {
    return value >= 0 ? `+${formatUsd(value)}` : formatUsd(value);
}

/** Average price rendered in cents, e.g. 0.919 -> "91.9¢". */
export function formatCents(price: number): string {
    const cents = price * 100;
    const rounded = Math.round(cents * 10) / 10;
    return `${rounded}¢`;
}

/**
 * Percent with an explicit plus sign and up to 2 decimals, e.g. 19.34 -> "+19.34%". Once the
 * magnitude reaches 1000% the decimals are dropped (e.g. 1234.56 -> "+1235%") so an extreme PnL
 * rate doesn't overflow the share-image label.
 */
export function formatSignedPercent(rate: number): string {
    const rounded = Math.abs(rate) >= 1000 ? Math.round(rate) : Math.round(rate * 100) / 100;
    return `${rounded >= 0 ? '+' : ''}${rounded}%`;
}

export function isFullLoss(pnlRate: number): boolean {
    // clients compute the rate in floating point (pnl / cost * 100), so a real full loss often
    // arrives as e.g. -99.99999994 — compare at the displayed (2-decimal) precision
    return Math.round(pnlRate * 100) / 100 === -100;
}
