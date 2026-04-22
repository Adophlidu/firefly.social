import { solana } from '@/chains/sol.js';

/**
 * Normalizes Solana chain ID to 501.
 * Both 101 and 501 represent Solana mainnet in different contexts.
 */
export function normalizeSolChainId(chainId: number) {
    return chainId === solana.id ? 501 : chainId;
}
