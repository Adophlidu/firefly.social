import type { AllPerpMetasResponse } from '@nktkas/hyperliquid';

/** Hyperliquid asset index `a` for cancel/order APIs (same rules as `useCancelOrders`). */
export function resolvePerpCoinIndex(coinName: string, allMetas: AllPerpMetasResponse): number {
    if (!allMetas?.length) return -1;

    const dexIndex = allMetas.findIndex((meta) => meta.universe.some((c) => c.name === coinName));
    if (dexIndex === -1) return -1;

    const meta = allMetas[dexIndex];
    const coinIndex = meta.universe.findIndex((c) => c.name === coinName);
    if (coinIndex === -1) return -1;

    return dexIndex === 0 ? coinIndex : 100000 + dexIndex * 10000 + coinIndex;
}
