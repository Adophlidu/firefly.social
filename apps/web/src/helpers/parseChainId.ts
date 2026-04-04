import { isValidChainIdEthereum, isValidChainIdSolana } from '@/helpers/isValidChainId.js';

export function parseChainId(chainId?: string | number) {
    return parseEthereumChainId(chainId) ?? parseSolanaChainId(chainId);
}

function parseEthereumChainId(chainId?: string | number) {
    if (!chainId) return null;
    const parsedChainId = typeof chainId === 'string' ? Number.parseInt(chainId, 10) : chainId;
    if (isValidChainIdEthereum(parsedChainId)) return parsedChainId;
    return null;
}

function parseSolanaChainId(chainId?: string | number) {
    if (!chainId) return null;
    const parsedChainId = typeof chainId === 'string' ? Number.parseInt(chainId, 10) : chainId;
    if (isValidChainIdSolana(parsedChainId)) return parsedChainId;
    return null;
}
