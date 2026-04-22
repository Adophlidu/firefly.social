import { parseEthereumChainId } from '@/chains/parseEthereumChainId.js';
import { parseSolanaChainId } from '@/chains/parseSolanaChainId.js';

export function parseChainId(chainId?: string | number): number | null {
    return parseEthereumChainId(chainId) ?? parseSolanaChainId(chainId);
}
