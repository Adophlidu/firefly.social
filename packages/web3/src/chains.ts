import { ETHEREUM_CHAIN_IDS } from '@/chains/eth.js';
import { solana, SOLANA_CHAIN_IDS } from '@/chains/sol.js';

export * from '@/chains/eth.js';
export * from '@/chains/sol.js';

export function isValidChainIdEthereum(chainId: number | undefined) {
    return typeof chainId === 'number' && ETHEREUM_CHAIN_IDS.some((id) => id === chainId);
}

export function isValidChainIdSolana(chainId: number | undefined) {
    return typeof chainId === 'number' && SOLANA_CHAIN_IDS.some((id) => id === chainId);
}

export function parseEthereumChainId(chainId?: string | number): number | null {
    if (!chainId) return null;
    const parsedChainId = typeof chainId === 'string' ? Number.parseInt(chainId, 10) : chainId;
    if (isValidChainIdEthereum(parsedChainId as number)) return parsedChainId as number;
    return null;
}

export function parseSolanaChainId(chainId?: string | number): number | null {
    if (!chainId) return null;
    const parsedChainId = typeof chainId === 'string' ? Number.parseInt(chainId, 10) : chainId;
    if (isValidChainIdSolana(parsedChainId as number)) return parsedChainId as number;
    return null;
}

export function parseChainId(chainId?: string | number): number | null {
    return parseEthereumChainId(chainId) ?? parseSolanaChainId(chainId);
}

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
    return chainId === solana.id ? 501 : chainId;
}

/**
 * Compares two chain IDs for equality, normalizing Solana chain IDs.
 * Both 101 and 501 are treated as equivalent (Solana mainnet).
 */
export function isSameSolanaChainId(chainId1: number | undefined, chainId2: number | undefined) {
    if (!chainId1 || !chainId2) return false;
    return normalizeSolChainId(chainId1) === normalizeSolChainId(chainId2);
}
