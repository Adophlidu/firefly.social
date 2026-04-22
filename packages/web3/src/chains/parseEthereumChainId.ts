import { isValidChainIdEthereum } from '@/chains/isValidChainIdEthereum.js';

export function parseEthereumChainId(chainId?: string | number): number | null {
    if (!chainId) return null;
    const parsedChainId = typeof chainId === 'string' ? Number.parseInt(chainId, 10) : chainId;
    if (isValidChainIdEthereum(parsedChainId as number)) return parsedChainId as number;
    return null;
}
