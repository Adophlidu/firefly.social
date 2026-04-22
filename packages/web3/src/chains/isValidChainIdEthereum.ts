import { ETHEREUM_CHAIN_IDS } from '@/chains/eth.js';

export function isValidChainIdEthereum(chainId: number | undefined) {
    return typeof chainId === 'number' && ETHEREUM_CHAIN_IDS.some((id) => id === chainId);
}
