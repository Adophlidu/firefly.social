import { ETHEREUM_CHAIN_IDS } from '@/chains/eth.js';
import { SOLANA_CHAIN_IDS } from '@/chains/sol.js';

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
