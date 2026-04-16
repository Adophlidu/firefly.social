import { chains } from '@dimensiondev/web3/chains';

import { SolanaChainId } from '@/constants/solana.js';

export function getChainName(chainId: number, useChainIdAsFallback = true) {
    if (chainId === SolanaChainId.Mainnet) return 'Solana';
    return chains.find((chain) => chain.id === chainId)?.name || (useChainIdAsFallback ? `${chainId}` : null);
}
