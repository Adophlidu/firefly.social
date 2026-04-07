/**
 * Converts a number to micros (multiplied by 1,000,000) as a bigint.
 */
export function toMicros(value: number): bigint {
    return BigInt(Math.trunc(value * 1_000_000));
}

/**
 * Computes the claim amount for a Polymarket position.
 * Returns a tuple of [amount0, amount1] as strings, or undefined if the position is not claimable.
 */
export function computeClaimAmount(pos: {
    negRisk: boolean;
    isWin: boolean;
    shares: number;
    cur_price: number;
    offset: number;
}): [string, string] | undefined {
    if (!pos.negRisk) return undefined;

    // iOS: default use currentValue; if isWin=false and size exists, use size.
    let valSource = Number(pos.cur_price) * Number(pos.shares);
    if (pos.isWin === false && Number.isFinite(pos.shares)) {
        valSource = Number(pos.shares);
    }

    const val = toMicros(Number.isFinite(valSource) ? valSource : 0);
    const idx = pos.offset ?? 0;
    const tuple: [bigint, bigint] = idx === 0 ? [val, 0n] : [0n, val];
    return [tuple[0].toString(), tuple[1].toString()];
}
