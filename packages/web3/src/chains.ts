import { ETHEREUM_CHAIN_IDS } from '@/chains/eth.js';
import { SOLANA_CHAIN_IDS } from '@/chains/sol.js';

export * from '@/chains/eth.js';
export * from '@/chains/sol.js';

export function isValidChainIdEthereum(chainId: number | undefined) {
    return typeof chainId === 'number' && ETHEREUM_CHAIN_IDS.some((id) => id === chainId);
}

export function isValidChainIdSolana(chainId: number | undefined) {
    return typeof chainId === 'number' && SOLANA_CHAIN_IDS.some((id) => id === chainId);
}
