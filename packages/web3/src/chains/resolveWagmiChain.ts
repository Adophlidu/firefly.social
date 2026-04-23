import { chains } from '@/chains/eth.js';

export function resolveWagmiChain(chainId: number) {
    return chains.find((chain) => chain.id === chainId);
}
