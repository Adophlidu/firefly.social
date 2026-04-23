import { chains } from '@/chains/eth.js';
import { isSolanaChain } from '@/chains/isSolanaChain.js';
import { solana, solanaChains } from '@/chains/sol.js';

const ALL_CHAINS = [...chains, ...solanaChains];

export function getChainName(chainId: number, useChainIdAsFallback = true) {
    if (isSolanaChain(chainId)) return solana.name;

    const chain = ALL_CHAINS.find((x) => x.id === chainId);
    return chain?.name || (useChainIdAsFallback ? `${chainId}` : null);
}
