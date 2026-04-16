import { isValidChainIdEthereum, isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import type { SolanaChainId } from '@/web3-shared/solana/types.js';

function parseEthereumChainId(chainId?: string | number): number | null {
    if (!chainId) return null;
    const parsedChainId = typeof chainId === 'string' ? Number.parseInt(chainId, 10) : chainId;
    if (isValidChainIdEthereum(parsedChainId as number)) return parsedChainId as number;
    return null;
}

function parseSolanaChainId(chainId?: string | number): SolanaChainId | null {
    if (!chainId) return null;
    const parsedChainId = typeof chainId === 'string' ? Number.parseInt(chainId, 10) : chainId;
    if (isValidChainIdSolana(parsedChainId as SolanaChainId)) return parsedChainId as SolanaChainId;
    return null;
}

export function parseChainId(chainId?: string | number): number | null {
    return parseEthereumChainId(chainId) ?? parseSolanaChainId(chainId);
}
