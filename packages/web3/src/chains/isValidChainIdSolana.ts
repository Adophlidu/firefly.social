import { SOLANA_CHAIN_IDS } from '@/chains/sol.js';

export function isValidChainIdSolana(chainId: number | undefined) {
    return typeof chainId === 'number' && SOLANA_CHAIN_IDS.some((id) => id === chainId);
}
