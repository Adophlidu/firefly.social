import { BigNumber } from 'bignumber.js';

export interface TpslExpectedPnlResult {
    /** e.g. "12.34" without currency prefix (for styling like OneKey). */
    amountText: string;
    isNegative: boolean;
}

/**
 * OneKey `calculateProfitLoss` (perpsUtils): (exit − entry) × sideMultiplier × amount, USD notional.
 */
export function computeTpslExpectedPnlUsd(options: {
    entryPx: string;
    exitPx: string;
    positionSizeAbs: string;
    side: 'long' | 'short';
    decimals?: number;
}): TpslExpectedPnlResult | null {
    const { entryPx, exitPx, positionSizeAbs, side, decimals = 2 } = options;
    const entry = new BigNumber(entryPx.replace(/,/g, '').trim());
    const exit = new BigNumber(exitPx.replace(/,/g, '').trim());
    const amount = new BigNumber(positionSizeAbs.replace(/,/g, '').trim());

    if (!entry.isFinite() || !exit.isFinite() || !amount.isFinite() || entry.lte(0) || amount.lte(0)) {
        return null;
    }

    const sideMultiplier = side === 'long' ? 1 : -1;
    const pnl = exit.minus(entry).multipliedBy(sideMultiplier).multipliedBy(amount);
    if (!pnl.isFinite()) {
        return null;
    }

    const isNegative = pnl.isNegative();
    const absText = pnl.abs().toFixed(decimals);
    return { amountText: absText, isNegative };
}
