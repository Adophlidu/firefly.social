import { SolanaChainId } from '@/constants/solana.js';

/**
 * Checks if a chain ID represents a Solana network.
 * Supports both 101 (SolanaChainId.Mainnet) and 501 (alternative identifier).
 */
export function isSolanaChain(chainId: number | null | undefined): chainId is SolanaChainId {
    return chainId === SolanaChainId.Mainnet || chainId === 501;
}

/**
 * Normalizes Solana chain ID to 501.
 * Both 101 and 501 represent Solana mainnet in different contexts.
 */
export function normalizeSolChainId(chainId: number): number {
    return chainId === SolanaChainId.Mainnet ? 501 : chainId;
}

/**
 * Compares two chain IDs for equality, normalizing Solana chain IDs.
 * Both 101 and 501 are treated as equivalent (Solana mainnet).
 */
export function chainsMatch(chainId1: number | undefined, chainId2: number | undefined): boolean {
    if (!chainId1 || !chainId2) return false;
    return normalizeSolChainId(chainId1) === normalizeSolChainId(chainId2);
}
