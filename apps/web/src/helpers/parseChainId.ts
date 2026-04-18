import { isValidChainIdEthereum, isValidChainIdSolana } from '@dimensiondev/web3/chains';

function parseEthereumChainId(chainId?: string | number): number | null {
    if (!chainId) return null;
    const parsedChainId = typeof chainId === 'string' ? Number.parseInt(chainId, 10) : chainId;
    if (isValidChainIdEthereum(parsedChainId as number)) return parsedChainId as number;
    return null;
}

function parseSolanaChainId(chainId?: string | number): number | null {
    if (!chainId) return null;
    const parsedChainId = typeof chainId === 'string' ? Number.parseInt(chainId, 10) : chainId;
    if (isValidChainIdSolana(parsedChainId as number)) return parsedChainId as number;
    return null;
}

export function parseChainId(chainId?: string | number): number | null {
    return parseEthereumChainId(chainId) ?? parseSolanaChainId(chainId);
}
