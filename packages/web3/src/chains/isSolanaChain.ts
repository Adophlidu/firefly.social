import { solana } from '@/chains/sol.js';

/**
 * Checks if a chain ID represents a Solana network.
 * Supports both 101 (solana.id) and 501 (alternative identifier).
 */
export function isSolanaChain(chainId: number | null | undefined) {
    return chainId === solana.id || chainId === 501;
}
