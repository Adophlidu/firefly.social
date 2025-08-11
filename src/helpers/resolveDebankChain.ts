import { DEBANK_CHAINS } from '@/constants/debank.js';

export function resolveDebankChain(chainIdOrDebankChain: string | number | undefined) {
    if (!chainIdOrDebankChain) return;
    if (typeof chainIdOrDebankChain === 'number') {
        const chain = DEBANK_CHAINS.find((chain) => chain.community_id === chainIdOrDebankChain);
        return chain;
    }
    const chain = DEBANK_CHAINS.find((chain) => chain.id === chainIdOrDebankChain);
    return chain;
}
