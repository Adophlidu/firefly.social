import { chains, solana } from '@dimensiondev/web3/chains';

export function getChainName(chainId: number, useChainIdAsFallback = true) {
    if (chainId === solana.id) return 'Solana';
    return chains.find((chain) => chain.id === chainId)?.name || (useChainIdAsFallback ? `${chainId}` : null);
}
