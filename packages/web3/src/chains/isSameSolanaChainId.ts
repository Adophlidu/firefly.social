import { normalizeSolChainId } from '@/chains/normalizeSolChainId.js';

/**
 * Compares two chain IDs for equality, normalizing Solana chain IDs.
 * Both 101 and 501 are treated as equivalent (Solana mainnet).
 */
export function isSameSolanaChainId(chainId1: number | undefined, chainId2: number | undefined) {
    if (!chainId1 || !chainId2) return false;
    return normalizeSolChainId(chainId1) === normalizeSolChainId(chainId2);
}
