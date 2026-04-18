import { solana } from '@dimensiondev/web3/chains';

/**
 * Checks if a chain ID represents a Solana network.
 * Supports both 101 (solana.id) and 501 (alternative identifier).
 */
export function isSolanaChain(chainId: number | null | undefined) {
    return chainId === solana.id || chainId === 501;
}

/**
 * Normalizes Solana chain ID to 501.
 * Both 101 and 501 represent Solana mainnet in different contexts.
 */
export function normalizeSolChainId(chainId: number) {
    // Normalize the Solana mainnet aliases to 501.
    return chainId === solana.id ? 501 : chainId;
}

/**
 * Compares two chain IDs for equality, normalizing Solana chain IDs.
 * Both 101 and 501 are treated as equivalent (Solana mainnet).
 */
export function chainsMatch(chainId1: number | undefined, chainId2: number | undefined) {
    if (!chainId1 || !chainId2) return false;
    return normalizeSolChainId(chainId1) === normalizeSolChainId(chainId2);
}
