import { chains } from '@/configs/chains.js';
import { SolanaChainId } from '@/constants/solana.js';

export function getChainName(chainId: number, useChainIdAsFallback = true) {
    if (chainId === SolanaChainId.Mainnet) return 'Solana';
    return chains.find((chain) => chain.id === chainId)?.name || (useChainIdAsFallback ? `${chainId}` : null);
}
