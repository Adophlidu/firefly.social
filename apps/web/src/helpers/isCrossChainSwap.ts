import type { SwapActivity } from '@/providers/types/Firefly.js';

/**
 * A swap is cross-chain only if the backend flagged it AND the destination
 * chain actually differs from the source chain. The `is_cross_chain` flag
 * alone is unreliable — bridge detectors (LiFi/RelayLink) can set it true
 * even for same-chain routes.
 */
export function isCrossChainSwap(activity: Pick<SwapActivity, 'is_cross_chain' | 'chain_id' | 'to_chain_id'>): boolean {
    if (!activity.is_cross_chain) return false;
    const toChainId = Number(activity.to_chain_id);
    return toChainId > 0 && toChainId !== activity.chain_id;
}
