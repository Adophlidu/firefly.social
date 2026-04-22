import { isValidChainIdSolana } from '@/chains/isValidChainIdSolana.js';

export function parseSolanaChainId(chainId?: string | number): number | null {
    if (!chainId) return null;
    const parsedChainId = typeof chainId === 'string' ? Number.parseInt(chainId, 10) : chainId;
    if (isValidChainIdSolana(parsedChainId as number)) return parsedChainId as number;
    return null;
}
